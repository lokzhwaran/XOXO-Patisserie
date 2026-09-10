import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { addresses: true, orders: { orderBy: { createdAt: "desc" }, include: { items: true } } },
  });
  if (!customer) notFound();

  const favouriteProducts = new Map<string, number>();
  for (const order of customer.orders) {
    for (const item of order.items) {
      favouriteProducts.set(item.nameSnapshot, (favouriteProducts.get(item.nameSnapshot) ?? 0) + item.quantity);
    }
  }
  const favourites = Array.from(favouriteProducts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">{customer.name}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{customer.phone} {customer.email ? `· ${customer.email}` : ""}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <a href={`tel:${customer.phone}`} className="text-[var(--color-primary)] underline">Call</a>
          <a href={`https://wa.me/${customer.phone.replace("+", "")}`} className="text-[var(--color-primary)] underline">WhatsApp</a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs text-[var(--color-muted-foreground)]">Total orders</p><p className="mt-1 font-heading text-xl">{customer.totalOrders}</p></div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs text-[var(--color-muted-foreground)]">Lifetime value</p><p className="mt-1 font-heading text-xl">{paiseToRupeeDisplay(customer.lifetimeValuePaise)}</p></div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs text-[var(--color-muted-foreground)]">Customer since</p><p className="mt-1 font-heading text-xl">{format(customer.createdAt, "d MMM yyyy")}</p></div>
      </div>

      {favourites.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-heading text-lg">Favourite products</h2>
          <div className="mt-2 flex flex-wrap gap-2">{favourites.map(([name, qty]) => <Badge key={name} tone="neutral">{name} × {qty}</Badge>)}</div>
        </div>
      )}

      {customer.addresses.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-heading text-lg">Saved addresses</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            {customer.addresses.map((address) => <p key={address.id}>{address.line1}, {address.area}, {address.city} {address.pincode}{address.isDefault ? " (default)" : ""}</p>)}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted-foreground)]"><tr><th className="p-3">Order</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
          <tbody>
            {customer.orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]">
                <td className="p-3"><Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-[var(--color-primary)]">{order.orderNumber}</Link></td>
                <td className="p-3">{paiseToRupeeDisplay(order.totalPaise)}</td>
                <td className="p-3"><Badge tone="neutral">{order.status}</Badge></td>
                <td className="p-3 text-xs text-[var(--color-muted-foreground)]">{format(order.createdAt, "d MMM yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
