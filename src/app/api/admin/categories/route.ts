import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!name || !slug) return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  try { await prisma.category.create({ data: { name, slug, description: body.description?.trim() || null } }); }
  catch { return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 }); }
  revalidatePath("/admin/menu", "page"); revalidatePath("/menu", "page");
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.id || !String(body.name ?? "").trim()) return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  await prisma.category.update({ where: { id: body.id }, data: { name: String(body.name).trim(), isActive: Boolean(body.isActive), sortOrder: Math.max(0, Math.floor(Number(body.sortOrder) || 0)) } });
  revalidatePath("/admin/menu", "page"); revalidatePath("/menu", "page");
  return NextResponse.json({ success: true });
}
