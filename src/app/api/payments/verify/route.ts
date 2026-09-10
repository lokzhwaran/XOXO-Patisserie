import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/providers/payments";
import { confirmOrderPaid } from "@/server/actions/confirm-payment";

export async function POST(request: Request) {
  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  const valid = getPaymentProvider().verifyPaymentSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: razorpay_order_id } });
  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  // This client-side callback confirms UX only; the webhook remains the source of truth and
  // will safely no-op here since confirmOrderPaid is idempotent.
  await confirmOrderPaid({
    orderId: payment.orderId,
    razorpayPaymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    razorpaySignature: razorpay_signature,
  });

  const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
  return NextResponse.json({ success: true, orderNumber: order?.orderNumber });
}
