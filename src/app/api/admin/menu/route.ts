import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthProvider, SESSION_COOKIE_NAME } from "@/lib/providers/auth";
import { deleteProductImage, normalizeImageUrl } from "@/lib/storage";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return Boolean(token && await getAuthProvider().verifySession(token));
}

/** Accepts an images array from the admin editor, dropping anything unsafe or non-renderable. */
function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeImageUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 6);
}


export async function POST(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const categoryId = String(body.categoryId ?? "");
  const sellingPricePaise = Math.round(Number(body.sellingPriceRupees) * 100);
  const costOfMakingPaise = Math.round(Number(body.costOfMakingRupees) * 100);
  const weekdayMax = Math.floor(Number(body.weekdayMax));
  const weekendMax = Math.floor(Number(body.weekendMax));
  if (!name || !categoryId || !body.code || body.sellingPriceRupees === "" || body.costOfMakingRupees === "" || body.weekdayMax === "" || body.weekendMax === "" || !Number.isFinite(sellingPricePaise) || !Number.isFinite(costOfMakingPaise) || !Number.isFinite(weekdayMax) || !Number.isFinite(weekendMax) || sellingPricePaise < 0 || costOfMakingPaise < 0 || weekdayMax < 0 || weekendMax < 0) {
    return NextResponse.json({ error: "Name, code, category, prices, and capacity limits are required" }, { status: 400 });
  }
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(body.code).toLowerCase()}`;
  try {
    const product = await prisma.product.create({ data: { name, code: String(body.code).trim().toUpperCase(), slug, categoryId, description: String(body.description ?? "").trim() || name, ingredients: String(body.ingredients ?? "").trim() || "Please ask us about ingredients.", isVeg: Boolean(body.isVeg), sellingPricePaise, costOfMakingPaise, weightGrams: Math.max(0, Math.floor(Number(body.weightGrams) || 0)), isFeatured: Boolean(body.isFeatured), images: parseImages(body.images) } });
    await prisma.capacityDefault.create({ data: { productId: product.id, weekdayMax, weekendMax } });
  } catch {
    return NextResponse.json({ error: "Product code or name already exists" }, { status: 409 });
  }
  revalidatePath("/", "page"); revalidatePath("/menu", "page"); revalidatePath("/admin/menu", "page");
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const numericValues = [body.sellingPriceRupees, body.costOfMakingRupees, body.weekdayMax, body.weekendMax].map(Number);
  if (!body.productId || !String(body.name).trim() || !body.categoryId || numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
    return NextResponse.json({ error: "Enter a product name, category, prices, and non-negative capacity limits" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!existing) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

  // Only overwrite optional descriptive fields when the client actually sent them, so a partial
  // payload (e.g. an inline price edit) can never blank out copy the admin entered elsewhere.
  const images = body.images === undefined ? existing.images : parseImages(body.images);
  const product = await prisma.product.update({
    where: { id: body.productId },
    data: {
      name: String(body.name).trim(),
      categoryId: String(body.categoryId),
      sellingPricePaise: Math.max(0, Math.round(Number(body.sellingPriceRupees) * 100)),
      costOfMakingPaise: Math.max(0, Math.round(Number(body.costOfMakingRupees) * 100)),
      isActive: Boolean(body.isActive),
      isFeatured: Boolean(body.isFeatured),
      images,
      ...(body.description !== undefined ? { description: String(body.description).trim() || existing.description } : {}),
      ...(body.ingredients !== undefined ? { ingredients: String(body.ingredients).trim() || existing.ingredients } : {}),
      ...(body.isVeg !== undefined ? { isVeg: Boolean(body.isVeg) } : {}),
      ...(body.weightGrams !== undefined && Number.isFinite(Number(body.weightGrams))
        ? { weightGrams: Math.max(0, Math.floor(Number(body.weightGrams))) }
        : {}),
    },
  });

  // Reclaim storage for images the admin removed in this save.
  for (const removed of existing.images.filter((url) => !images.includes(url))) {
    await deleteProductImage(removed);
  }

  const weekdayMax = Math.max(0, Math.floor(Number(body.weekdayMax)));
  const weekendMax = Math.max(0, Math.floor(Number(body.weekendMax)));
  await prisma.capacityDefault.upsert({
    where: { productId: product.id },
    update: {
      weekdayMax,
      weekendMax,
    },
    create: {
      productId: product.id,
      weekdayMax,
      weekendMax,
    },
  });
  const futureCapacities = await prisma.dailyCapacity.findMany({ where: { productId: product.id, date: { gte: new Date() } } });
  await prisma.$transaction(
    futureCapacities
      .filter((capacity) => capacity.reservedQuantity + capacity.soldQuantity === 0)
      .map((capacity) => prisma.dailyCapacity.update({ where: { id: capacity.id }, data: { maxQuantity: capacity.date.getUTCDay() === 0 || capacity.date.getUTCDay() === 6 ? weekendMax : weekdayMax } }))
  );

  revalidatePath("/menu", "page");
  revalidatePath("/", "page");
  revalidatePath("/admin/menu", "page");
  revalidatePath("/admin/menu/capacity", "page");
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId, mode } = await request.json();
  if (!productId) return NextResponse.json({ error: "Product id is required" }, { status: 400 });

  if (mode === "hard") {
    const orderItemCount = await prisma.orderItem.count({ where: { productId } });
    if (orderItemCount > 0) {
      return NextResponse.json({ error: `This item has ${orderItemCount} past order(s) and can't be permanently deleted — hide it instead.` }, { status: 409 });
    }
    await prisma.$transaction([
      prisma.dailyCapacity.deleteMany({ where: { productId } }),
      prisma.capacityDefault.deleteMany({ where: { productId } }),
      prisma.productVariant.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);
  } else {
    await prisma.product.update({ where: { id: productId }, data: { isActive: false, isFeatured: false } });
  }

  revalidatePath("/", "page"); revalidatePath("/menu", "page"); revalidatePath("/admin/menu", "page");
  return NextResponse.json({ success: true });
}
