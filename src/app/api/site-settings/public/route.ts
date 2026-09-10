import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({
    businessName: settings.businessName,
    tagline: settings.tagline,
    heroHeading: settings.heroHeading,
    heroSubheading: settings.heroSubheading,
    heroCtaLabel: settings.heroCtaLabel,
    logoUrl: settings.logoUrl,
    whatsappNumber: settings.whatsappNumber,
    contactEmail: settings.contactEmail,
    businessAddress: settings.businessAddress,
    footerCopy: settings.footerCopy,
    gstRatePercent: settings.gstRatePercent,
    packagingChargePaise: settings.packagingChargePaise,
    minOrderValuePaise: settings.minOrderValuePaise,
    deliveryNote: settings.deliveryNote,
    ordersEnabled: settings.ordersEnabled,
    orderingPausedMessage: settings.orderingPausedMessage,
    nextAvailableDate: settings.nextAvailableDate,
    nextAvailableMessage: settings.nextAvailableMessage,
    leadTimeHours: settings.leadTimeHours,
    timeSlots: settings.timeSlots,
    serviceablePincodes: settings.serviceablePincodes,
    theme: settings.theme,
  });
}
