import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDeliveryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const pageSize = 20;
  const [deliveries, total] = await Promise.all([prisma.delivery.findMany({
    include: { order: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip: (page - 1) * pageSize,
  }), prisma.delivery.count()]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Delivery</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Porter API access requires a business account (no self-serve keys) — this list is powered by the manual
        booking flow by default. Configure <code>PORTER_API_KEY</code> to enable automatic booking attempts.
      </p>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted-foreground)]">
            <tr><th className="p-3">Order</th><th className="p-3">Provider</th><th className="p-3">Rider</th><th className="p-3">Charged</th><th className="p-3">Actual Fare</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]">
                <td className="p-3"><Link href={`/admin/orders/${d.order.orderNumber}`} className="text-[var(--color-primary)] underline">{d.order.orderNumber}</Link></td>
                <td className="p-3">{d.provider}</td>
                <td className="p-3">{d.riderName ?? "—"}</td>
                <td className="p-3">{d.quotedFarePaise ? paiseToRupeeDisplay(d.quotedFarePaise) : "—"}</td>
                <td className="p-3">{d.actualFarePaise ? paiseToRupeeDisplay(d.actualFarePaise) : "—"}</td>
                <td className="p-3">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
        <span>Page {page} of {totalPages} · {total} deliveries</span>
        <div className="flex gap-2">
          {page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/admin/delivery?page=${page - 1}`}>Previous</Link></Button>}
          {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={`/admin/delivery?page=${page + 1}`}>Next</Link></Button>}
        </div>
      </div>
    </div>
  );
}
