import { NextResponse } from "next/server";
import { trackOrderSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`track:${ip}`, 5, 10 * 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = trackOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number and order ID" }, { status: 400 });
  }

  const { phone, orderNumber } = parsed.data;
  const order = await prisma.order.findFirst({
    where: { orderNumber, customer: { phone: `+91${phone}` } },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      delivery: true,
      payments: true,
      address: true,
      customer: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "No matching order found for that phone number and order ID." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
