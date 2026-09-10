import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/providers/payments";
import { confirmOrderPaid } from "@/server/actions/confirm-payment";
import { releaseReservedCapacity } from "@/lib/capacity";

/**
 * Razorpay webhook — the source of truth for payment state (payment.captured, payment.failed,
 * refund.processed). Idempotent via the WebhookEvent table keyed on the event id. Handles both
 * live Razorpay webhooks and self-fired sandbox webhooks through the same signature-verification
 * code path (see src/lib/providers/payments/signature.ts).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!getPaymentProvider().verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventId: string | undefined = event.id;

  if (eventId) {
    const already = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
    if (already) {
      return NextResponse.json({ success: true, idempotent: true });
    }
    await prisma.webhookEvent.create({
      data: { id: eventId, provider: "razorpay", eventType: event.event },
    });
  }

  try {
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const rpOrderId = payment.order_id;
      const existing = await prisma.payment.findFirst({ where: { razorpayOrderId: rpOrderId } });
      if (existing) {
        await confirmOrderPaid({
          orderId: existing.orderId,
          razorpayPaymentId: payment.id,
          razorpayOrderId: rpOrderId,
          method: payment.method,
        });
      }
    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const rpOrderId = payment.order_id;
      const existing = await prisma.payment.findFirst({ where: { razorpayOrderId: rpOrderId } });
      if (existing) {
        const order = await prisma.order.findUnique({ where: { id: existing.orderId }, include: { items: true } });
        if (order && order.paymentStatus !== "PAID") {
          await prisma.payment.update({ where: { id: existing.id }, data: { status: "FAILED" } });
          await prisma.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } });
          await prisma.orderStatusEvent.create({
            data: { orderId: order.id, fromStatus: order.status, toStatus: "PAYMENT_FAILED", actor: "SYSTEM", note: "Payment failed" },
          });
        }
      }
    } else if (event.event === "refund.processed") {
      const refund = event.payload.refund.entity;
      const payment = await prisma.payment.findFirst({ where: { razorpayPaymentId: refund.payment_id } });
      if (payment) {
        const order = await prisma.order.findUnique({ where: { id: payment.orderId }, include: { items: true } });
        if (order) {
          await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" } });
          await prisma.orderStatusEvent.create({
            data: { orderId: order.id, fromStatus: order.status, toStatus: "REFUNDED", actor: "SYSTEM", note: "Refund processed" },
          });
          await releaseReservedCapacity(
            order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            order.requestedDate
          );
        }
      }
    }
  } catch (err) {
    console.error("Webhook processing error", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
