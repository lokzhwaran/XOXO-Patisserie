import { prisma } from "@/lib/prisma";
import { isSandboxMode } from "@/lib/app-mode";
import { redirect } from "next/navigation";
import { SandboxConsoleClient } from "@/components/sandbox/console-client";

export default async function SandboxConsolePage() {
  if (!isSandboxMode()) redirect("/");

  const outbox = await prisma.notificationOutbox.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const paymentEvents = await prisma.sandboxEvent.findMany({
    where: { domain: "PAYMENT" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const deliveryEvents = await prisma.sandboxEvent.findMany({
    where: { domain: "DELIVERY" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const pendingOrders = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { payments: true },
  });

  return (
    <SandboxConsoleClient
      outbox={outbox.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      paymentEvents={paymentEvents.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
      deliveryEvents={deliveryEvents.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
      pendingOrders={pendingOrders.map((o) => ({
        orderNumber: o.orderNumber,
        totalPaise: o.totalPaise,
        razorpayOrderId: o.payments[0]?.razorpayOrderId ?? null,
      }))}
    />
  );
}
