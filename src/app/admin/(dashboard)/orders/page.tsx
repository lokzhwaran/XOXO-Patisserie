import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderFilters } from "@/components/admin/order-filters";
import Link from "next/link";
import { format, endOfDay } from "date-fns";
import type { Prisma, OrderStatus, PaymentStatus, FulfilmentType } from "@prisma/client";
import { expireStalePendingOrders } from "@/lib/order-expiry";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; paymentStatus?: string; fulfilmentType?: string; from?: string; to?: string }>;
}) {
  await expireStalePendingOrders();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 20;

  const where: Prisma.OrderWhereInput = {};
  if (params.status) where.status = params.status as OrderStatus;
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus as PaymentStatus;
  if (params.fulfilmentType) where.fulfilmentType = params.fulfilmentType as FulfilmentType;
  if (params.from || params.to) {
    where.createdAt = {
      ...(params.from ? { gte: new Date(`${params.from}T00:00:00`) } : {}),
      ...(params.to ? { lte: endOfDay(new Date(`${params.to}T00:00:00`)) } : {}),
    };
  }
  if (params.search?.trim()) {
    const search = params.search.trim();
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filterParams: Record<string, string> = {};
  if (params.search) filterParams.search = params.search;
  if (params.status) filterParams.status = params.status;
  if (params.paymentStatus) filterParams.paymentStatus = params.paymentStatus;
  if (params.fulfilmentType) filterParams.fulfilmentType = params.fulfilmentType;
  if (params.from) filterParams.from = params.from;
  if (params.to) filterParams.to = params.to;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Orders</h1>
        <Button asChild variant="outline" size="sm"><a href="/api/admin/orders/export">Export CSV</a></Button>
      </div>

      <OrderFilters
        search={params.search ?? ""}
        status={params.status ?? ""}
        paymentStatus={params.paymentStatus ?? ""}
        fulfilmentType={params.fulfilmentType ?? ""}
        from={params.from ?? ""}
        to={params.to ?? ""}
      />

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted-foreground)]">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-[var(--color-muted-foreground)]">No orders match these filters.</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-muted)]">
                <td className="p-3">
                  <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-[var(--color-primary)]">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="p-3">
                  {order.customer.name}
                  <div className="text-xs text-[var(--color-muted-foreground)]">{order.customer.phone}</div>
                </td>
                <td className="p-3">{order.items.length} item(s)</td>
                <td className="p-3">{paiseToRupeeDisplay(order.totalPaise)}</td>
                <td className="p-3">
                  <Badge tone={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "FAILED" ? "danger" : "warning"}>
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge tone="neutral">{order.status}</Badge>
                </td>
                <td className="p-3 text-xs text-[var(--color-muted-foreground)]">
                  {format(order.createdAt, "d MMM, h:mm a")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
        <span>Page {page} of {totalPages} · {total} orders</span>
        <div className="flex gap-2">
          {page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/admin/orders?${new URLSearchParams({ ...filterParams, page: String(page - 1) }).toString()}`}>Previous</Link></Button>}
          {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={`/admin/orders?${new URLSearchParams({ ...filterParams, page: String(page + 1) }).toString()}`}>Next</Link></Button>}
        </div>
      </div>
    </div>
  );
}
