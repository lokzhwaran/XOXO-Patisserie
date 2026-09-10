import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/capacity";

export async function POST(request: Request) {
  const body = await request.json();
  const items: { productId: string; quantity: number; name: string }[] = body.items ?? [];
  const date = new Date(body.date);

  const problems: { productId: string; name: string; available: number; requested: number }[] = [];
  for (const item of items) {
    const availability = await getAvailability(item.productId, date);
    if (availability.available < item.quantity) {
      problems.push({ productId: item.productId, name: item.name, available: availability.available, requested: item.quantity });
    }
  }

  return NextResponse.json({ ok: problems.length === 0, problems });
}
