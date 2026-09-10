import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthProvider, SESSION_COOKIE_NAME } from "@/lib/providers/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getAuthProvider().verifySession(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ordersEnabled } = await request.json();
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return NextResponse.json({ error: "Settings not found" }, { status: 404 });

  await prisma.siteSettings.update({ where: { id: settings.id }, data: { ordersEnabled: Boolean(ordersEnabled) } });

  revalidatePath("/", "page");
  revalidatePath("/menu", "page");
  revalidatePath("/cart", "page");
  revalidatePath("/checkout", "layout");
  revalidatePath("/admin", "page");

  return NextResponse.json({ success: true });
}
