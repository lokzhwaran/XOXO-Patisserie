import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { generateOrderNumber } from "@/lib/order-number";
import { reserveCapacity, CapacityExceededError } from "@/lib/capacity";
import { addDays } from "date-fns";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const source = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!source) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const requestedDate = addDays(new Date(), 1);
  try {
    await reserveCapacity(source.items.map((item) => ({ productId: item.productId, productName: item.nameSnapshot, quantity: item.quantity })), requestedDate);
  } catch (error) {
    if (error instanceof CapacityExceededError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }

  const orderNumber = await generateOrderNumber();
  const newOrder = await prisma.order.create({
    data: {
      orderNumber,
      customerId: source.customerId,
      addressId: source.addressId,
      fulfilmentType: source.fulfilmentType,
      requestedDate,
      requestedTimeSlot: source.requestedTimeSlot,
      subtotalPaise: source.subtotalPaise,
      gstPaise: source.gstPaise,
      packagingPaise: source.packagingPaise,
      totalPaise: source.totalPaise,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      adminNotes: `Duplicated from ${source.orderNumber} by ${admin.name}`,
      items: { create: source.items.map((item) => ({ productId: item.productId, variantId: item.variantId, nameSnapshot: item.nameSnapshot, codeSnapshot: item.codeSnapshot, unitPricePaise: item.unitPricePaise, unitCostPaise: item.unitCostPaise, quantity: item.quantity, lineTotalPaise: item.lineTotalPaise })) },
      statusEvents: { create: { toStatus: "PENDING_PAYMENT", actor: "ADMIN", note: `Duplicated from ${source.orderNumber}` } },
    },
  });

  return NextResponse.json({ success: true, orderNumber: newOrder.orderNumber });
}
