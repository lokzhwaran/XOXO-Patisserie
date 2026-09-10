import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthProvider, SESSION_COOKIE_NAME } from "@/lib/providers/auth";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return Boolean(token && await getAuthProvider().verifySession(token));
}

export async function PATCH(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const date = new Date(`${body.date}T00:00:00.000Z`);
  const maxQuantity = Math.max(0, Math.floor(Number(body.maxQuantity)));
  if (!body.productId || Number.isNaN(date.getTime()) || !Number.isFinite(maxQuantity)) {
    return NextResponse.json({ error: "Product, date, and a valid capacity are required" }, { status: 400 });
  }

  const existing = await prisma.dailyCapacity.findUnique({
    where: { productId_date: { productId: body.productId, date } },
  });
  const booked = (existing?.reservedQuantity ?? 0) + (existing?.soldQuantity ?? 0);
  if (maxQuantity < booked) {
    return NextResponse.json({ error: `Capacity cannot be below ${booked} already booked` }, { status: 409 });
  }

  await prisma.dailyCapacity.upsert({
    where: { productId_date: { productId: body.productId, date } },
    update: { maxQuantity, isBlocked: Boolean(body.isBlocked) },
    create: { productId: body.productId, date, maxQuantity, isBlocked: Boolean(body.isBlocked) },
  });

  revalidatePath("/menu", "page");
  revalidatePath("/admin/menu", "page");
  revalidatePath("/admin/menu/capacity", "page");
  return NextResponse.json({ success: true });
}
