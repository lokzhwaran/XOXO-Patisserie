import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const { method, reference } = await request.json();
  if (!method?.trim()) return NextResponse.json({ error: "Payment method is required" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ error: "Order is already marked as paid" }, { status: 409 });

  await prisma.$transaction([
    prisma.payment.create({
      data: { orderId, purpose: "ORDER", provider: "manual", method, amountPaise: order.totalPaise, status: "PAID", rawPayload: { markedBy: admin.name, reference: reference ?? null } },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", adminNotes: [order.adminNotes, `Marked paid manually (${method}${reference ? `, ref: ${reference}` : ""}) by ${admin.name}`].filter(Boolean).join("\n") },
    }),
    prisma.orderStatusEvent.create({ data: { orderId, fromStatus: order.status, toStatus: order.status === "PENDING_PAYMENT" ? "CONFIRMED" : order.status, actor: "ADMIN", note: `Payment marked paid manually via ${method}` } }),
  ]);
  if (order.status === "PENDING_PAYMENT") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
  }

  revalidatePath(`/admin/orders/${order.orderNumber}`, "page");
  revalidatePath("/admin/orders", "page");
  return NextResponse.json({ success: true });
}
