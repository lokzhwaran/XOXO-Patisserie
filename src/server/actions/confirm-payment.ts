import { prisma } from "@/lib/prisma";
import { convertReservedToSold } from "@/lib/capacity";
import { sendWhatsAppMessage, whatsappDeepLink, renderTemplate, DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/notifications/whatsapp";
import { sendEmail } from "@/lib/notifications/email";
import { createAlert } from "@/lib/notifications/alerts";

/**
 * Idempotently marks an order as paid & confirmed. Called from BOTH the client-side checkout
 * callback (fast UX) and the Razorpay webhook (source of truth) — safe to call twice.
 */
export async function confirmOrderPaid(params: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  method?: string;
}): Promise<{ alreadyProcessed: boolean }> {
  const order = await prisma.order.findUnique({ where: { id: params.orderId }, include: { items: true, customer: true } });
  if (!order) throw new Error("Order not found");

  if (order.paymentStatus === "PAID") {
    return { alreadyProcessed: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { orderId: order.id, razorpayOrderId: params.razorpayOrderId },
      data: {
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        method: params.method,
        status: "PAID",
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await tx.orderStatusEvent.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: "CONFIRMED", actor: "SYSTEM", note: "Payment confirmed" },
    });
  });

  await convertReservedToSold(
    order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    order.requestedDate
  );

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track?orderNumber=${order.orderNumber}`;
  const message = renderTemplate(DEFAULT_WHATSAPP_TEMPLATES.ORDER_CONFIRMED, {
    name: order.customer.name,
    orderId: order.orderNumber,
    trackingUrl,
  });
  await sendWhatsAppMessage({ to: order.customer.phone, body: message, relatedOrderId: order.id });

  if (order.customer.email) {
    await sendEmail({
      to: order.customer.email,
      subject: `Order ${order.orderNumber} confirmed — XOXO Patisserie`,
      html: `<p>Hi ${order.customer.name},</p><p>Your order <strong>${order.orderNumber}</strong> is confirmed. Total paid: ₹${(order.totalPaise / 100).toFixed(2)}.</p><p>Track it here: <a href="${trackingUrl}">${trackingUrl}</a></p>`,
    });
  }

  await createAlert({
    type: "PAYMENT_CONFIRMED",
    severity: "INFO",
    title: `Payment received for ${order.orderNumber}`,
    body: `${order.customer.name} paid ₹${(order.totalPaise / 100).toFixed(2)}.`,
    relatedOrderId: order.id,
  });

  return { alreadyProcessed: false };
}

export function whatsappCustomerLink(phone: string, orderNumber: string) {
  return whatsappDeepLink(phone, `Hi! I need help finding my order. My order ID is ${orderNumber}.`);
}
