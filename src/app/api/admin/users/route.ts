import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { hashPassword } from "@/lib/providers/auth/sandbox";

const ROLES = ["OWNER", "MANAGER", "STAFF"];

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "OWNER") return NextResponse.json({ error: "Only owners can invite staff" }, { status: 403 });

  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "STAFF");
  const password = String(body.password ?? "");
  if (!email || !name || !ROLES.includes(role) || password.length < 8) {
    return NextResponse.json({ error: "Name, email, role, and an 8+ character password are required" }, { status: 400 });
  }
  try {
    await prisma.adminUser.create({ data: { email, name, role, passwordHash: await hashPassword(password) } });
  } catch {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "OWNER") return NextResponse.json({ error: "Only owners can change roles" }, { status: 403 });

  const { id, role } = await request.json();
  if (!id || !ROLES.includes(role)) return NextResponse.json({ error: "A valid user id and role are required" }, { status: 400 });
  if (id === admin.id && role !== "OWNER") {
    const ownerCount = await prisma.adminUser.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) return NextResponse.json({ error: "At least one owner must remain" }, { status: 409 });
  }
  await prisma.adminUser.update({ where: { id }, data: { role } });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "OWNER") return NextResponse.json({ error: "Only owners can remove staff" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "User id is required" }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: "You cannot remove your own account" }, { status: 409 });
  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
