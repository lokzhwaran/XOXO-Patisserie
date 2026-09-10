import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { alertId, action } = body as { alertId?: string; action?: "read" | "readAll" | "clearAll" };

  if (action === "clearAll") {
    await prisma.adminAlert.deleteMany();
    return NextResponse.json({ success: true });
  }

  if (action === "readAll" || !alertId) {
    await prisma.adminAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  await prisma.adminAlert.update({
    where: { id: alertId },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
