import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderId } = await params;
  const { adminNotes } = await request.json();
  await prisma.order.update({ where: { id: orderId }, data: { adminNotes: String(adminNotes ?? "").slice(0, 4000) } });
  return NextResponse.json({ success: true });
}
