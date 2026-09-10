import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Prisma } from "@prisma/client";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 10;
  const search = params.search?.trim() ?? "";

  const where: Prisma.CustomerWhereInput = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search, mode: "insensitive" } }] }
    : {};

  const [customers, total] = await Promise.all([prisma.customer.findMany({
    where,
    orderBy: { lifetimeValuePaise: "desc" },
    include: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    take: pageSize,
    skip: (page - 1) * pageSize,
  }), prisma.customer.count({ where })]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h1 className="font-heading text-2xl">Customers</h1><Button asChild variant="outline" size="sm"><a href="/api/admin/customers/export">Export CSV</a></Button></div>
      <form className="max-w-sm" action="/admin/customers" method="GET">
        <Input name="search" defaultValue={search} placeholder="Search name or phone" />
      </form>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted-foreground)]">
            <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Orders</th><th className="p-3">Lifetime Value</th><th className="p-3">Last Order</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-[var(--color-muted-foreground)]">No customers match this search.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-muted)]">
                <td className="p-3"><Link href={`/admin/customers/${c.id}`} className="font-medium text-[var(--color-primary)]">{c.name}</Link></td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.totalOrders}</td>
                <td className="p-3">{paiseToRupeeDisplay(c.lifetimeValuePaise)}</td>
                <td className="p-3">{c.orders[0] ? format(c.orders[0].createdAt, "d MMM yyyy") : "—"}</td>
                <td className="p-3"><Button asChild size="sm" variant="outline"><Link href={`/admin/customers/${c.id}`}>View</Link></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
        <span>Page {page} of {totalPages} · {total} customers</span>
        <div className="flex gap-2">
          {page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/admin/customers?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page - 1) }).toString()}`}>Previous</Link></Button>}
          {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={`/admin/customers?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page + 1) }).toString()}`}>Next</Link></Button>}
        </div>
      </div>
    </div>
  );
}
