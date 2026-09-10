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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <CheckoutStepper current="payment" />
      <h1 className="mt-8 font-heading text-3xl">Payment</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-heading text-lg">Order Summary — {order.orderNumber}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-[var(--color-border)]">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-sm">
                <span>
                  {item.nameSnapshot} × {item.quantity}
                </span>
                <span>{paiseToRupeeDisplay(item.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{paiseToRupeeDisplay(order.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{paiseToRupeeDisplay(order.gstPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packaging</span>
              <span>{paiseToRupeeDisplay(order.packagingPaise)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-heading text-lg">
              <span>Total</span>
              <span>{paiseToRupeeDisplay(order.totalPaise)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
            Delivery charges are not included and will be collected separately after your order is packed.
          </p>
        </div>
        <PaymentPanel orderNumber={order.orderNumber} amountPaise={order.totalPaise} />
      </div>
    </div>
  );
}
