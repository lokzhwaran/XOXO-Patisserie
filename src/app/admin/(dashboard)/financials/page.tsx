import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { ExpenseManager } from "@/components/admin/expense-manager";
import { ProductProfitabilityTable } from "@/components/admin/product-profitability-table";
import { DateRangeFilter } from "@/components/admin/date-range-filter";

const RANGES: Record<string, number> = { "1": 1, "7": 7, "30": 30, "90": 90 };

export default async function AdminFinancialsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const customRange = Boolean(params.from && params.to);
  const rangeKey = params.range ?? "30";
  const since = customRange ? startOfDay(new Date(`${params.from}T00:00:00`)) : subDays(new Date(), RANGES[rangeKey] ?? 30);
  const until = customRange ? endOfDay(new Date(`${params.to}T00:00:00`)) : new Date();
  const rangeLabel = customRange ? `${format(since, "d MMM")} – ${format(until, "d MMM")}` : (RANGES[rangeKey] ?? 30) === 1 ? "Today" : `Last ${RANGES[rangeKey] ?? 30} Days`;

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since, lte: until }, paymentStatus: "PAID" },
    include: { items: true },
  });
  const expenses = await prisma.expense.findMany({ where: { date: { gte: since, lte: until } }, orderBy: { date: "desc" } });

  const revenue = orders.reduce((sum, o) => sum + o.totalPaise, 0);
  const cogs = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.unitCostPaise * i.quantity, 0), 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountPaise, 0);
  const netProfit = grossProfit - totalExpenses;

  const productProfitability = new Map<string, { name: string; units: number; revenue: number; cost: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const entry = productProfitability.get(item.codeSnapshot) ?? { name: item.nameSnapshot, units: 0, revenue: 0, cost: 0 };
      entry.units += item.quantity;
      entry.revenue += item.lineTotalPaise;
      entry.cost += item.unitCostPaise * item.quantity;
      productProfitability.set(item.codeSnapshot, entry);
    }
  }
  const productRows = Array.from(productProfitability.entries())
    .map(([code, p]) => ({ code, ...p, profit: p.revenue - p.cost }))
    .sort((a, b) => b.profit - a.profit);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl">Financials ({rangeLabel})</h1>
        <DateRangeFilter basePath="/admin/financials" activeRange={customRange ? null : rangeKey} from={params.from ?? ""} to={params.to ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          ["Revenue", revenue],
          ["COGS", cogs],
          ["Gross Profit", grossProfit],
          ["Expenses", totalExpenses],
          ["Net Profit", netProfit],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
            <p className="mt-1 font-heading text-xl">{paiseToRupeeDisplay(value as number)}</p>
          </div>
        ))}
      </div>

      <ProductProfitabilityTable rows={productRows} />
      <section className="flex flex-col gap-3">
        <div><h2 className="font-heading text-xl">Expenses</h2><p className="text-sm text-[var(--color-muted-foreground)]">Add and remove operating expenses included in this range&apos;s profit view.</p></div>
        <ExpenseManager expenses={expenses.map((expense) => ({ ...expense, date: expense.date.toISOString().slice(0, 10) }))} />
      </section>
    </div>
  );
}
