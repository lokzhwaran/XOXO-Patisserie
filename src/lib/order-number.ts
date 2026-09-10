import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "./prisma";

const TZ = "Asia/Kolkata";

/** Generates a human-readable order number: BK-YYMMDD-XXXX */
export async function generateOrderNumber(): Promise<string> {
  const datePart = formatInTimeZone(new Date(), TZ, "yyMMdd");
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BK-${datePart}-${suffix}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (!existing) return orderNumber;
  }
  // Extremely unlikely fallback
  return `BK-${datePart}-${Date.now().toString().slice(-6)}`;
}

export function nowInKolkata(): Date {
  return new Date();
}

export function todayDateStringInKolkata(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}
