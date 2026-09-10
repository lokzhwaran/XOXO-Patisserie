import { prisma } from "./prisma";

export class CapacityExceededError extends Error {
  constructor(
    public productName: string,
    public available: number,
    public requested: number
  ) {
    super(
      `Only ${available} ${productName} can be baked for that date. You requested ${requested}.`
    );
    this.name = "CapacityExceededError";
  }
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Ensures a DailyCapacity row exists for (productId, date), creating it from
 * CapacityDefault (weekday/weekend max) if missing. Must be called inside the
 * same transaction that will lock/update the row.
 */
async function ensureDailyCapacity(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  productId: string,
  date: Date
) {
  const existing = await tx.dailyCapacity.findUnique({
    where: { productId_date: { productId, date } },
  });
  if (existing) return existing;

  const capacityDefault = await tx.capacityDefault.findUnique({ where: { productId } });
  const maxQuantity = capacityDefault
    ? isWeekend(date)
      ? capacityDefault.weekendMax
      : capacityDefault.weekdayMax
    : 0;

  return tx.dailyCapacity.create({
    data: { productId, date, maxQuantity, reservedQuantity: 0, soldQuantity: 0 },
  });
}

export interface AvailabilityResult {
  productId: string;
  date: Date;
  maxQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  available: number;
  isBlocked: boolean;
}

export async function getAvailability(productId: string, date: Date): Promise<AvailabilityResult> {
  const cap = await prisma.$transaction((tx) => ensureDailyCapacity(tx, productId, date));
  return {
    productId,
    date: cap.date,
    maxQuantity: cap.maxQuantity,
    reservedQuantity: cap.reservedQuantity,
    soldQuantity: cap.soldQuantity,
    available: cap.isBlocked ? 0 : Math.max(0, cap.maxQuantity - cap.reservedQuantity - cap.soldQuantity),
    isBlocked: cap.isBlocked,
  };
}

/**
 * Atomically reserves capacity for a set of (productId, quantity) pairs on a given date.
 * Runs each product's row-lock + check + update inside one serializable transaction so two
 * concurrent checkouts for the last unit produce exactly one success and one clean failure.
 * Throws CapacityExceededError (rolling back the whole transaction) if any item can't be reserved.
 */
export async function reserveCapacity(
  items: { productId: string; productName: string; quantity: number }[],
  date: Date
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      for (const item of items) {
        await ensureDailyCapacity(tx, item.productId, date);
        // Row lock via raw SQL FOR UPDATE to serialize concurrent reservations on this row.
        const rows = await tx.$queryRaw<
          { id: string; maxQuantity: number; reservedQuantity: number; soldQuantity: number; isBlocked: boolean }[]
        >`SELECT id, "maxQuantity", "reservedQuantity", "soldQuantity", "isBlocked"
            FROM "DailyCapacity"
            WHERE "productId" = ${item.productId} AND "date" = ${date}
            FOR UPDATE`;
        const cap = rows[0];
        if (!cap || cap.isBlocked) {
          throw new CapacityExceededError(item.productName, 0, item.quantity);
        }
        const available = cap.maxQuantity - cap.reservedQuantity - cap.soldQuantity;
        if (available < item.quantity) {
          throw new CapacityExceededError(item.productName, Math.max(0, available), item.quantity);
        }
        await tx.dailyCapacity.update({
          where: { id: cap.id },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }
    },
    { isolationLevel: "Serializable" }
  );
}

/** Converts reserved capacity to sold once payment is confirmed. */
export async function convertReservedToSold(
  items: { productId: string; quantity: number }[],
  date: Date
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.dailyCapacity.update({
        where: { productId_date: { productId: item.productId, date } },
        data: {
          reservedQuantity: { decrement: item.quantity },
          soldQuantity: { increment: item.quantity },
        },
      });
    }
  });
}

/** Releases a reservation, e.g. on cancellation or expired PENDING_PAYMENT orders. */
export async function releaseReservedCapacity(
  items: { productId: string; quantity: number }[],
  date: Date
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.dailyCapacity.update({
        where: { productId_date: { productId: item.productId, date } },
        data: { reservedQuantity: { decrement: item.quantity } },
      });
    }
  });
}

/** Releases sold capacity, e.g. cancelling or refunding an order that was already paid (its
 * capacity was converted from reserved to sold at payment confirmation). */
export async function releaseSoldCapacity(
  items: { productId: string; quantity: number }[],
  date: Date
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.dailyCapacity.update({
        where: { productId_date: { productId: item.productId, date } },
        data: { soldQuantity: { decrement: item.quantity } },
      });
    }
  });
}
