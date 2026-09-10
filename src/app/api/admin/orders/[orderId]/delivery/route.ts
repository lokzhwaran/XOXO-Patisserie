import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/providers/payments";
import { sendWhatsAppMessage, renderTemplate, DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/notifications/whatsapp";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body = await request.json();
  const { provider, riderName, riderPhone, farePaise, trackingUrl } = body;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await prisma.delivery.upsert({
    where: { orderId },
    update: { provider, riderName, riderPhone, trackingUrl, actualFarePaise: farePaise, quotedFarePaise: farePaise, status: "OUT_FOR_DELIVERY" },
    create: { orderId, provider, riderName, riderPhone, trackingUrl, actualFarePaise: farePaise, quotedFarePaise: farePaise, status: "OUT_FOR_DELIVERY" },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "OUT_FOR_DELIVERY", deliveryChargePaise: farePaise, deliveryChargeStatus: "PENDING" },
  });
  await prisma.orderStatusEvent.create({
    data: { orderId, fromStatus: order.status, toStatus: "OUT_FOR_DELIVERY", actor: "ADMIN", note: "Delivery arranged" },
  });

  let paymentLink = "";
  const paymentProvider = getPaymentProvider();
  if (farePaise > 0) {
    try {
      const link = await paymentProvider.createPaymentLink({
        amountPaise: farePaise,
        description: `Delivery charge for order ${order.orderNumber}`,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        referenceId: `${order.orderNumber}-delivery`,
      });
      paymentLink = link.shortUrl;
    } catch {
      // Payment link creation failed — admin can resend manually; never block the delivery flow.
    }
  }

  const message = renderTemplate(DEFAULT_WHATSAPP_TEMPLATES.DELIVERY_ARRANGED, {
    name: order.customer.name,
    orderId: order.orderNumber,
    riderName: riderName ?? "",
    riderPhone: riderPhone ?? "",
    paymentLink,
  });
  await sendWhatsAppMessage({ to: order.customer.phone, body: message, relatedOrderId: order.id });

  return NextResponse.json({ success: true });
}
