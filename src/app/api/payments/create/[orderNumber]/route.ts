import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/providers/payments";

export async function POST(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED") {
    return NextResponse.json({ error: "This order is not awaiting payment" }, { status: 409 });
  }
  if (order.reservationExpiresAt && order.reservationExpiresAt < new Date() && order.status === "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Your reservation has expired. Please place the order again." }, { status: 410 });
  }

  const provider = getPaymentProvider();
  const rpOrder = await provider.createOrder({
    amountPaise: order.totalPaise,
    receipt: order.orderNumber,
    notes: { orderId: order.id, orderNumber: order.orderNumber },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      purpose: "ORDER",
      amountPaise: order.totalPaise,
      razorpayOrderId: rpOrder.id,
      status: "PENDING",
      isSandbox: provider.mode === "sandbox",
    },
  });

  const checkoutUrl = provider.getCheckoutUrl(rpOrder, order.orderNumber);

  return NextResponse.json({
    razorpayOrderId: rpOrder.id,
    amountPaise: order.totalPaise,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    orderNumber: order.orderNumber,
    mode: provider.mode,
    checkoutUrl,
  });
}
