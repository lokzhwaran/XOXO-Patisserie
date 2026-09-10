import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const header = "Order Number,Customer,Phone,Status,Payment Status,Total (INR),Created At\n";
  const rows = orders
    .map((o) =>
      [
        o.orderNumber,
        o.customer.name,
        o.customer.phone,
        o.status,
        o.paymentStatus,
        (o.totalPaise / 100).toFixed(2),
        o.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=orders.csv",
    },
  });
}
