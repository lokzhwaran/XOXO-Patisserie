import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay } from "@/lib/money";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { DeliveryPanel } from "@/components/admin/delivery-panel";
import { OrderActions } from "@/components/admin/order-actions";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      customer: true,
      address: true,
      payments: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      delivery: true,
    },
  });
  if (!order) notFound();

  const margin = order.items.reduce((sum, i) => sum + (i.unitPricePaise - i.unitCostPaise) * i.quantity, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl">Order {order.orderNumber}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Placed {format(order.createdAt, "d MMM yyyy, h:mm a")} · Requested {format(order.requestedDate, "d MMM")} · {order.requestedTimeSlot}
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-heading text-lg">Customer</h2>
          <p className="mt-2 text-sm">{order.customer.name} · {order.customer.phone}</p>
          {order.address && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {order.address.line1}, {order.address.area}, {order.address.city} {order.address.pincode}
            </p>
          )}
          <div className="mt-3 flex gap-3 text-sm">
            <a href={`tel:${order.customer.phone}`} className="text-[var(--color-primary)] underline">Call</a>
            <a href={`https://wa.me/${order.customer.phone.replace("+", "")}`} className="text-[var(--color-primary)] underline">WhatsApp</a>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-heading text-lg">Items</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr><th className="pb-2">Item</th><th className="pb-2">Qty</th><th className="pb-2">Price</th><th className="pb-2">Cost</th><th className="pb-2">Margin</th></tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2">{item.nameSnapshot} ({item.codeSnapshot})</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{paiseToRupeeDisplay(item.unitPricePaise)}</td>
                  <td className="py-2">{paiseToRupeeDisplay(item.unitCostPaise)}</td>
                  <td className="py-2">{paiseToRupeeDisplay((item.unitPricePaise - item.unitCostPaise) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 text-sm font-medium">
            <span>Total: {paiseToRupeeDisplay(order.totalPaise)}</span>
            <span>Est. Margin: {paiseToRupeeDisplay(margin)}</span>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-heading text-lg">Status Timeline</h2>
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {order.statusEvents.map((event, i) => (
              <li key={i} className="flex justify-between border-b border-[var(--color-border)] pb-2 last:border-0">
                <span>{event.toStatus}{event.note ? ` — ${event.note}` : ""}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{format(event.createdAt, "d MMM, h:mm a")}</span>
              </li>
            ))}
          </ol>
          {order.cancellationReason && (
            <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-sm text-[var(--color-danger)]">
              Cancellation reason: {order.cancellationReason}
            </p>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-heading text-lg">Payment History</h2>
          {order.payments.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">No payments recorded yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex justify-between border-b border-[var(--color-border)] pb-2 last:border-0">
                  <span>
                    {paiseToRupeeDisplay(payment.amountPaise)} · {payment.purpose === "DELIVERY_CHARGE" ? "Delivery charge" : "Order"} · {payment.method ?? payment.provider}
                  </span>
                  <span className="text-right">
                    <Badge tone={payment.status === "PAID" ? "success" : payment.status === "FAILED" ? "danger" : payment.status === "REFUNDED" ? "warning" : "neutral"}>{payment.status}</Badge>
                    <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">{format(payment.createdAt, "d MMM, h:mm a")}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
        <DeliveryPanel
          orderId={order.id}
          fulfilmentType={order.fulfilmentType}
          delivery={order.delivery}
          deliveryChargeStatus={order.deliveryChargeStatus}
          deliveryChargePaise={order.deliveryChargePaise}
        />
        <OrderActions orderId={order.id} orderNumber={order.orderNumber} paymentStatus={order.paymentStatus} adminNotes={order.adminNotes ?? ""} />
      </div>
    </div>
  );
}
