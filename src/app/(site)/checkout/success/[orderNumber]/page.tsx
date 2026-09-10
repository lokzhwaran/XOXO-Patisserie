import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutStepper } from "@/components/checkout-stepper";
import { Button } from "@/components/ui/button";
import { CopyOrderId } from "@/components/copy-order-id";
import { paiseToRupeeDisplay } from "@/lib/money";
import Link from "next/link";
import { format } from "date-fns";

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, address: true, customer: true },
  });
  if (!order) notFound();
  // Orders are pre-paid only — never show a "confirmed / paid" page before payment is verified.
  if (order.paymentStatus !== "PAID") redirect(`/checkout/payment/${order.orderNumber}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 text-center sm:px-6 lg:px-8">
      <CheckoutStepper current="confirmation" />
      <div className="mt-8 sm:mt-10 text-4xl sm:text-5xl">🎉</div>
      <h1 className="mt-3 sm:mt-4 font-heading text-2xl sm:text-3xl">Order confirmed!</h1>
      <p className="mt-2 text-xs sm:text-sm text-[var(--color-muted-foreground)]">
        Save this ID — you&apos;ll need it to track your order.
      </p>
      <div className="mt-3 sm:mt-4">
        <CopyOrderId orderNumber={order.orderNumber} />
      </div>

      <div className="mt-6 sm:mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 text-left">
        <h2 className="font-heading text-base sm:text-lg">Order Summary</h2>
        <ul className="mt-3 flex flex-col divide-y divide-[var(--color-border)] text-xs sm:text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span className="font-medium">{item.nameSnapshot} × {item.quantity}</span>
              <span>{paiseToRupeeDisplay(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 font-heading text-base sm:text-lg">
          <span>Total Paid</span>
          <span>{paiseToRupeeDisplay(order.totalPaise)}</span>
        </div>
        <p className="mt-3 text-xs sm:text-sm text-[var(--color-muted-foreground)]">
          Expected: {format(order.requestedDate, "EEEE, d MMM")} · {order.requestedTimeSlot}
        </p>
        {order.address && (
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            Delivering to: {order.address.line1}, {order.address.area}, {order.address.city} {order.address.pincode}
          </p>
        )}
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
          <Link href={`/track?orderNumber=${order.orderNumber}`}>Track my order</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <a href={`/api/orders/${order.orderNumber}/receipt`} target="_blank" rel="noreferrer">
            Save receipt (PDF)
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Hi! I'd like to ask about my order ${order.orderNumber}.`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Support
          </a>
        </Button>
      </div>
    </div>
  );
}
