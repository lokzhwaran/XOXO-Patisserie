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

  const body = await request.json();
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return NextResponse.json({ error: "Settings not found" }, { status: 404 });

  const splitList = (value: unknown) =>
    String(value ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const freeDeliveryThreshold = String(body.freeDeliveryThresholdPaise ?? "").trim();

  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      businessName: body.businessName,
      tagline: body.tagline,
      contactEmail: body.contactEmail,
      whatsappNumber: body.whatsappNumber,
      logoUrl: body.logoUrl || null,
      heroHeading: body.heroHeading,
      heroSubheading: body.heroSubheading,
      heroCtaLabel: body.heroCtaLabel,
      aboutHeading: body.aboutHeading,
      aboutCopy: body.aboutCopy,
      footerCopy: body.footerCopy,
      whyUsCopy: body.whyUsCopy,
      testimonials: body.testimonials,
      faq: body.faq,
      businessAddress: body.businessAddress,
      fssaiNumber: body.fssaiNumber,
      gstNumber: body.gstNumber,
      instagramUrl: body.instagramUrl || null,
      facebookUrl: body.facebookUrl || null,
      gstRatePercent: body.gstRatePercent,
      packagingChargePaise: body.packagingChargePaise,
      minOrderValuePaise: body.minOrderValuePaise,
      orderingPausedMessage: body.orderingPausedMessage,
      leadTimeHours: body.leadTimeHours,
      nextAvailableDate: body.nextAvailableDate ? new Date(body.nextAvailableDate) : null,
      nextAvailableMessage: body.nextAvailableMessage,
      timeSlots: splitList(body.timeSlots),
      serviceablePincodes: splitList(body.serviceablePincodes),
      deliveryNote: body.deliveryNote,
      deliveryBaseChargePaise: body.deliveryBaseChargePaise,
      deliveryPerKmChargePaise: body.deliveryPerKmChargePaise,
      freeDeliveryThresholdPaise: freeDeliveryThreshold ? Math.round(Number(freeDeliveryThreshold) * 100) : null,
      pickupAddress: body.pickupAddress,
      tryAutoDeliveryBooking: Boolean(body.tryAutoDeliveryBooking),
      razorpayTestMode: Boolean(body.razorpayTestMode),
      theme: body.theme,
    },
  });

  revalidatePath("/", "page");
  revalidatePath("/menu", "page");
  revalidatePath("/checkout", "layout");
  revalidatePath("/admin", "page");
  revalidatePath("/admin/settings", "page");

  return NextResponse.json({ success: true });
}
