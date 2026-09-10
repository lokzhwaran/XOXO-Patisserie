import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseReservedCapacity, releaseSoldCapacity } from "@/lib/capacity";
import { sendWhatsAppMessage, renderTemplate, DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/notifications/whatsapp";
import { requireAdmin } from "@/lib/require-admin";
import { tryAutoBookPorterDelivery } from "@/lib/delivery/auto-book";
import type { OrderStatus } from "@prisma/client";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const { toStatus, reason } = await request.json();
  const validStatuses: OrderStatus[] = [
    "PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "BAKED", "PACKED",
    "OUT_FOR_DELIVERY", "DELIVERED", "READY_FOR_PICKUP", "CANCELLED",
    "REFUNDED", "PAYMENT_FAILED",
  ];
  if (!validStatuses.includes(toStatus as OrderStatus)) {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isCancelling = toStatus === "CANCELLED" && order.status !== "CANCELLED";
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus as OrderStatus,
        ...(isCancelling ? { cancellationReason: reason?.trim() || "Cancelled by admin", cancelledAt: new Date() } : {}),
      },
    });
    await tx.orderStatusEvent.create({
      data: { orderId, fromStatus: order.status, toStatus: toStatus as OrderStatus, actor: "ADMIN", note: isCancelling ? reason?.trim() || undefined : undefined },
    });
  });

  if (isCancelling) {
    // Capacity for a paid order was already converted from reserved to sold at payment confirmation.
    const releaseCapacity = order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_PAID" ? releaseSoldCapacity : releaseReservedCapacity;
    await releaseCapacity(
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      order.requestedDate
    );
  }

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track?orderNumber=${order.orderNumber}`;
  const message = renderTemplate(DEFAULT_WHATSAPP_TEMPLATES.STATUS_CHANGE, {
    name: order.customer.name,
    orderId: order.orderNumber,
    status: toStatus,
    trackingUrl,
  });
  await sendWhatsAppMessage({ to: order.customer.phone, body: message, relatedOrderId: order.id });

  // Only DELIVERY orders that just became ready (PACKED) get auto-booked; PICKUP orders never do.
  if (toStatus === "PACKED") {
    await tryAutoBookPorterDelivery(orderId);
  }

  return NextResponse.json({ success: true });
}
