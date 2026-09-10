import { prisma } from "../prisma";
import { getAvailability } from "../capacity";

export interface AlertParams {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  body: string;
  relatedOrderId?: string;
  relatedProductId?: string;
}

export async function createAlert(params: AlertParams) {
  return prisma.adminAlert.create({ data: params });
}

/**
 * Call after any capacity reservation for a given product/date. Fires 80%-booked and
 * fully-booked alerts exactly once per threshold crossing per product/date by checking whether
 * an identical alert already exists for that (type, productId, date-in-title) combination.
 */
export async function checkCapacityAlerts(productId: string, date: Date) {
  const availability = await getAvailability(productId, date);
  if (availability.maxQuantity === 0) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const bookedRatio = (availability.reservedQuantity + availability.soldQuantity) / availability.maxQuantity;
  const dateStr = date.toISOString().slice(0, 10);

  if (bookedRatio >= 1) {
    await createAlertOnce(
      "CAPACITY_FULL",
      "WARNING",
      `${product.name} fully booked for ${dateStr}`,
      `${product.name} (${product.code}) has reached its bake limit of ${availability.maxQuantity} for ${dateStr}.`,
      productId
    );
  } else if (bookedRatio >= 0.8) {
    await createAlertOnce(
      "CAPACITY_WARNING",
      "INFO",
      `${product.name} is 80% booked for ${dateStr}`,
      `${product.name} (${product.code}) has ${availability.available} of ${availability.maxQuantity} left for ${dateStr}. Consider raising the limit.`,
      productId
    );
  }
}

export async function recordBlockedByCapacityAttempt(productId: string, date: Date) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  const dateStr = date.toISOString().slice(0, 10);
  const existing = await prisma.adminAlert.findFirst({
    where: { type: "CAPACITY_BLOCKED_ATTEMPT", relatedProductId: productId, title: { contains: dateStr } },
  });
  if (existing) {
    await prisma.adminAlert.update({
      where: { id: existing.id },
      data: { body: bumpAttemptCount(existing.body) },
    });
  } else {
    await createAlert({
      type: "CAPACITY_BLOCKED_ATTEMPT",
      severity: "INFO",
      title: `Customers blocked by capacity — ${product.name} (${dateStr})`,
      body: "1 customer tried to order beyond capacity today.",
      relatedProductId: productId,
    });
  }
}

function bumpAttemptCount(body: string): string {
  const match = body.match(/(\d+) customer/);
  const count = match ? parseInt(match[1], 10) + 1 : 1;
  return `${count} customers tried to order beyond capacity today — consider raising the limit.`;
}

async function createAlertOnce(
  type: string,
  severity: AlertParams["severity"],
  title: string,
  body: string,
  productId: string
) {
  const existing = await prisma.adminAlert.findFirst({
    where: { type, relatedProductId: productId, title },
  });
  if (existing) return;
  await createAlert({ type, severity, title, body, relatedProductId: productId });
}
