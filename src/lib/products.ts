import { prisma } from "./prisma";
import { getAvailability } from "./capacity";
import { todayDateStringInKolkata } from "./order-number";

export interface ProductAvailability {
  productId: string;
  available: number;
}

/** Returns per-product remaining capacity for a given date (defaults to today, Asia/Kolkata). */
export async function getMenuAvailability(productIds: string[], dateStr?: string): Promise<Record<string, number>> {
  const date = new Date(dateStr ?? todayDateStringInKolkata());
  const result: Record<string, number> = {};
  for (const id of productIds) {
    const availability = await getAvailability(id, date);
    result[id] = availability.available;
  }
  return result;
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });
}

export async function getAllActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
}
