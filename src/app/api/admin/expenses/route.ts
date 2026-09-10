import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ExpenseCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const amountPaise = Math.round(Number(body.amountRupees) * 100);
  if (!body.date || !body.description?.trim() || !Number.isFinite(amountPaise) || amountPaise < 0 || !Object.values(ExpenseCategory).includes(body.category)) {
    return NextResponse.json({ error: "Date, category, description, and a valid amount are required" }, { status: 400 });
  }
  await prisma.expense.create({ data: { date: new Date(`${body.date}T00:00:00.000Z`), category: body.category, description: body.description.trim(), amountPaise, notes: body.notes?.trim() || null } });
  revalidatePath("/admin/financials", "page");
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Expense id is required" }, { status: 400 });
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/financials", "page");
  return NextResponse.json({ success: true });
}
