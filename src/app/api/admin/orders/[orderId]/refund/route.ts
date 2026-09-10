import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { releaseSoldCapacity } from "@/lib/capacity";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const { reason } = await request.json();
  if (!reason?.trim()) return NextResponse.json({ error: "Refund reason is required" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "REFUNDED") return NextResponse.json({ error: "Order is already refunded" }, { status: 409 });
  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_PAID") {
    return NextResponse.json({ error: "Only paid orders can be refunded" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.payment.create({ data: { orderId, purpose: "ORDER", provider: "manual", amountPaise: order.totalPaise, status: "REFUNDED", rawPayload: { reason, processedBy: admin.name } } }),
    prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED", paymentStatus: "REFUNDED", cancellationReason: reason, cancelledAt: new Date() } }),
    prisma.orderStatusEvent.create({ data: { orderId, fromStatus: order.status, toStatus: "REFUNDED", actor: "ADMIN", note: reason } }),
  ]);

  if (order.status !== "CANCELLED" && order.status !== "REFUNDED") {
    // Capacity for a paid order was converted from reserved to sold at payment confirmation.
    await releaseSoldCapacity(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), order.requestedDate);
  }
  await sendWhatsAppMessage({ to: order.customer.phone, body: `Hi ${order.customer.name}, your order ${order.orderNumber} has been refunded. Reason: ${reason}`, relatedOrderId: order.id });

  revalidatePath(`/admin/orders/${order.orderNumber}`, "page");
  revalidatePath("/admin/orders", "page");
  return NextResponse.json({ success: true });
}
