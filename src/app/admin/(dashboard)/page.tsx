import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { AdminOrderingToggle } from "@/components/admin/ordering-toggle";
import { expireStalePendingOrders } from "@/lib/order-expiry";

const RANGES: Record<string, number> = { "1": 1, "7": 7, "30": 30, "90": 90 };

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await expireStalePendingOrders();
  const params = await searchParams;
  const customRange = Boolean(params.from && params.to);
  const rangeKey = params.range ?? "30";
  const since = customRange ? startOfDay(new Date(`${params.from}T00:00:00`)) : subDays(new Date(), RANGES[rangeKey] ?? 30);
  const until = customRange ? endOfDay(new Date(`${params.to}T00:00:00`)) : new Date();
  const rangeLabel = customRange ? `${format(since, "d MMM")} – ${format(until, "d MMM")}` : (RANGES[rangeKey] ?? 30) === 1 ? "today" : `${RANGES[rangeKey] ?? 30}d`;

  const [orders30d, revenueAgg, pendingPayments, statusCounts, activeProducts, totalCustomers, recentOrders, settings] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since, lte: until } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: since, lte: until }, paymentStatus: "PAID" },
      _sum: { totalPaise: true },
    }),
    prisma.order.count({ where: { paymentStatus: "PENDING" } }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true }, where: { createdAt: { gte: since, lte: until } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.order.findMany({
      include: { customer: true },
      where: { createdAt: { gte: since, lte: until } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.siteSettings.findFirst(),
  ]);

  const revenue = revenueAgg._sum.totalPaise ?? 0;
  const avgOrderValue = orders30d > 0 ? Math.round(revenue / orders30d) : 0;

  const kpis = [
    { label: `Revenue (${rangeLabel})`, value: paiseToRupeeDisplay(revenue) },
    { label: `Orders (${rangeLabel})`, value: orders30d.toString() },
    { label: "Avg Order Value", value: paiseToRupeeDisplay(avgOrderValue) },
    { label: "Pending Payments", value: pendingPayments.toString() },
    { label: "Active Products", value: activeProducts.toString() },
    { label: "Customers", value: totalCustomers.toString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl">Dashboard</h1>
        <DateRangeFilter basePath="/admin" activeRange={customRange ? null : rangeKey} from={params.from ?? ""} to={params.to ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent>
              <p className="text-xs text-[var(--color-muted-foreground)]">{k.label}</p>
              <p className="mt-1 font-heading text-2xl">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg">Ordering</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">Instantly pause or resume customer ordering site-wide.</p>
          </div>
          <AdminOrderingToggle initialEnabled={settings?.ordersEnabled ?? true} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent>
            <h2 className="font-heading text-lg">Orders by Status</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statusCounts.map((s) => (
                <div key={s.status} className="rounded-[var(--radius-base)] bg-[var(--color-muted)] p-3 text-center transition-colors">
                  <p className="text-xs text-[var(--color-muted-foreground)]">{s.status}</p>
                  <p className="font-heading text-xl">{s._count.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-lg">Recent Orders</h2>
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-base)] bg-[var(--color-muted)] p-3 transition-colors">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{order.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{paiseToRupeeDisplay(order.totalPaise)}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{format(order.createdAt, "d MMM")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
