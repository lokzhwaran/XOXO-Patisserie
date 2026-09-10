import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutStepper } from "@/components/checkout-stepper";
import { PaymentPanel } from "@/components/payment-panel";
import { paiseToRupeeDisplay } from "@/lib/money";

export default async function CheckoutPaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, address: true },
  });
  if (!order) notFound();
  if (order.paymentStatus === "PAID") redirect(`/checkout/success/${order.orderNumber}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <CheckoutStepper current="payment" />
      <h1 className="mt-6 sm:mt-8 font-heading text-2xl sm:text-3xl">Payment</h1>
      <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
          <h2 className="font-heading text-base sm:text-lg">Order Summary — {order.orderNumber}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-[var(--color-border)]">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-xs sm:text-sm">
                <span className="font-medium">
                  {item.nameSnapshot} × {item.quantity}
                </span>
                <span>{paiseToRupeeDisplay(item.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
              <span>{paiseToRupeeDisplay(order.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">GST</span>
              <span>{paiseToRupeeDisplay(order.gstPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Packaging</span>
              <span>{paiseToRupeeDisplay(order.packagingPaise)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-heading text-base sm:text-lg">
              <span>Total</span>
              <span>{paiseToRupeeDisplay(order.totalPaise)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            Delivery charges are not included and will be collected separately after your order is packed.
          </p>
        </div>
        <PaymentPanel orderNumber={order.orderNumber} amountPaise={order.totalPaise} />
      </div>
    </div>
  );
}
