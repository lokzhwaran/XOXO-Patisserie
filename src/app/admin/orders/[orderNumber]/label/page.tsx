import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/require-admin";

export default async function PackingLabelPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  if (!await requireAdmin()) redirect("/admin/login");
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true, customer: true, address: true } });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-md p-8 text-black print:p-0">
      <div className="rounded border-2 border-black p-6">
        <h1 className="text-xl font-bold">XOXO Patisserie</h1>
        <p className="mt-1 text-sm">Order {order.orderNumber} · {format(order.requestedDate, "d MMM yyyy")} · {order.requestedTimeSlot}</p>
        <hr className="my-3 border-black" />
        <p className="font-semibold">{order.customer.name}</p>
        <p className="text-sm">{order.customer.phone}</p>
        {order.address && <p className="mt-1 text-sm">{order.address.line1}, {order.address.area}, {order.address.city} {order.address.pincode}</p>}
        <hr className="my-3 border-black" />
        <ul className="text-sm">
          {order.items.map((item) => <li key={item.id} className="flex justify-between py-1"><span>{item.nameSnapshot} ({item.codeSnapshot})</span><span>× {item.quantity}</span></li>)}
        </ul>
        {order.occasionMessage && <p className="mt-3 text-sm italic">&ldquo;{order.occasionMessage}&rdquo;</p>}
        {order.fulfilmentType === "PICKUP" && <p className="mt-3 text-sm font-semibold">PICKUP ORDER</p>}
      </div>
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </div>
  );
}
