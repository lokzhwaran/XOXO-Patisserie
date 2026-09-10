import { prisma } from "@/lib/prisma";
import { releaseReservedCapacity } from "@/lib/capacity";
import { subMinutes } from "date-fns";

/**
 * Cancels PENDING_PAYMENT orders whose 15-minute reservation window has lapsed, releasing their
 * reserved capacity. Also sweeps up orders with no reservationExpiresAt at all (e.g. seeded demo
 * data, or any row created before this field existed) once they're older than 15 minutes — a
 * plain `reservationExpiresAt: { lt: now }` filter silently excludes null values in Prisma, which
 * left old PENDING_PAYMENT rows stuck forever. Cheap and idempotent — safe to call on every
 * admin Orders/Dashboard load instead of requiring a separate cron job.
 */
export async function expireStalePendingOrders(): Promise<void> {
  const now = new Date();
  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      OR: [
        { reservationExpiresAt: { lt: now } },
        { reservationExpiresAt: null, createdAt: { lt: subMinutes(now, 15) } },
      ],
    },
    include: { items: true },
  });
  if (staleOrders.length === 0) return;

  for (const order of staleOrders) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED" } }),
      prisma.orderStatusEvent.create({
        data: { orderId: order.id, fromStatus: "PENDING_PAYMENT", toStatus: "PAYMENT_FAILED", actor: "SYSTEM", note: "Payment window expired without payment" },
      }),
    ]);
    try {
      // Orders created outside the real checkout flow (e.g. seed data) never actually reserved
      // capacity, so there may be no matching DailyCapacity row to release — never let that
      // failure stop the sweep or break the page that triggered it.
      await releaseReservedCapacity(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), order.requestedDate);
    } catch {
      // No-op — nothing to release for this order/date.
    }
  }
}
