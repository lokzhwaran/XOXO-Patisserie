import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  if (!await requireAdmin()) return new Response("Unauthorized", { status: 401 });
  const customers = await prisma.customer.findMany({ orderBy: { lifetimeValuePaise: "desc" } });
  const header = "Name,Phone,Email,Orders,Lifetime Value (INR),Created At\n";
  const rows = customers.map((customer) => [customer.name, customer.phone, customer.email ?? "", customer.totalOrders, (customer.lifetimeValuePaise / 100).toFixed(2), customer.createdAt.toISOString()].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new Response(header + rows, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=customers.csv" } });
}
