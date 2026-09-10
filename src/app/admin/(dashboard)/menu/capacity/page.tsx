import { prisma } from "@/lib/prisma";
import { format, addDays } from "date-fns";
import Link from "next/link";
import { CapacityEditor } from "@/components/admin/capacity-editor";
import { todayDateStringInKolkata } from "@/lib/order-number";

export default async function CapacityCalendarPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productFilter } = await searchParams;
  const allProducts = await prisma.product.findMany({ include: { capacityDefault: true }, orderBy: { sortOrder: "asc" } });
  const products = productFilter ? allProducts.filter((p) => p.id === productFilter) : allProducts;
  const today = new Date(`${todayDateStringInKolkata()}T00:00:00.000Z`);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const capacities = await prisma.dailyCapacity.findMany({
    where: { date: { gte: days[0], lte: days[days.length - 1] } },
  });
  const capMap = new Map(capacities.map((c) => [`${c.productId}_${c.date.toISOString().slice(0, 10)}`, c]));
  const editorCapacities = products.flatMap((product) => days.map((day) => {
    const date = day.toISOString().slice(0, 10);
    const existing = capMap.get(`${product.id}_${date}`);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    return {
      productId: product.id,
      date,
      maxQuantity: existing?.maxQuantity ?? (weekend ? product.capacityDefault?.weekendMax ?? 0 : product.capacityDefault?.weekdayMax ?? 0),
      reservedQuantity: existing?.reservedQuantity ?? 0,
      soldQuantity: existing?.soldQuantity ?? 0,
      isBlocked: existing?.isBlocked ?? false,
      isOverridden: Boolean(existing),
    };
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Capacity Calendar</h1>
        {productFilter && <Link href="/admin/menu/capacity" className="text-sm text-[var(--color-primary)] underline">View all products</Link>}
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Set the maximum units for each product and date. Reserved and sold units are protected; a limit cannot be lowered below what is already booked.
        This calendar always shows a rolling 14-day window starting today, but each date&apos;s limit is saved independently — a date you set once stays exactly as you set it and is never changed automatically later.
        Dates you have never touched fall back to the weekday/weekend defaults from Menu &amp; Inventory until you save an explicit value for that date.
      </p>
      {products.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">Product not found.</p>
      ) : (
        <CapacityEditor
          key={productFilter ?? "all"}
          products={products.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
          days={days.map((day) => ({ date: day.toISOString().slice(0, 10), label: format(day, "d MMM") }))}
          capacities={editorCapacities}
        />
      )}
    </div>
  );
}
