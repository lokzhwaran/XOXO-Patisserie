import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME, parseThemeJson, themeToCssVars, googleFontsHref } from "@/lib/theme";
import type { SiteSettings } from "@prisma/client";

export const DEFAULT_HERO_IMAGE_URL = "/images/hero-patisserie.png";

export function getHeroImageUrl(heroImageUrl: string | null) {
  return heroImageUrl && !["/images/hero.jpg", "/images/hero.svg"].includes(heroImageUrl)
    ? heroImageUrl
    : DEFAULT_HERO_IMAGE_URL;
}

/**
 * Fetches SiteSettings server-side and injects the active theme as CSS custom properties on
 * <html>. Site content lives outside this — see individual pages — but every colour/font/radius
 * value must flow through these vars so admin theme changes apply site-wide with no redeploy.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await prisma.siteSettings.findFirst();
  if (settings) return settings;
  // Fallback so pages never crash if seeding hasn't run yet.
  return {
    id: "fallback",
    isSingleton: true,
    theme: DEFAULT_THEME as unknown as object,
    logoUrl: null,
    faviconUrl: null,
    businessName: "XOXO Patisserie",
    tagline: "Brownies made with a lot of love, butter & good vibes",
    contactEmail: "hello@xoxopatisserie.in",
    whatsappNumber: "+919999999999",
    businessAddress: "Chennai, Tamil Nadu, India",
    fssaiNumber: "11421999000000",
    gstNumber: "33AAAAA0000A1Z5",
    instagramUrl: null,
    facebookUrl: null,
    heroHeading: "A little sweetness, made to linger.",
    heroSubheading: "Small-batch brownies, cookies and gifting treats, baked fresh by XOXO Patisserie in Chennai.",
    heroCtaLabel: "Order Now",
    heroImageUrl: DEFAULT_HERO_IMAGE_URL,
    aboutHeading: "A Little Sweeter Life",
    aboutCopy: "",
    aboutImageUrl: null,
    whyUsCopy: null,
    testimonials: null,
    faq: null,
    footerCopy: "Good things are sweeter together.",
    ordersEnabled: true,
    orderingPausedMessage: "We're taking a short break!",
    nextAvailableDate: null,
    nextAvailableMessage: null,
    blockedDateRanges: null,
    leadTimeHours: 24,
    timeSlots: ["10:00-13:00", "13:00-16:00", "16:00-19:00", "19:00-21:00"],
    serviceablePincodes: null,
    gstRatePercent: 5,
    packagingChargePaise: 3000,
    minOrderValuePaise: 30000,
    deliveryNote: "Delivery charges are calculated after your order is packed and are collected separately.",
    deliveryBaseChargePaise: 4000,
    deliveryPerKmChargePaise: 1000,
    freeDeliveryThresholdPaise: null,
    pickupAddress: "XOXO Patisserie, Chennai, Tamil Nadu",
    tryAutoDeliveryBooking: false,
    razorpayTestMode: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies SiteSettings;
}

export function ThemeStyleTag({ settings }: { settings: SiteSettings }) {
  const theme = parseThemeJson(settings.theme);
  return (
    <>
      <link rel="stylesheet" href={googleFontsHref(theme)} />
      <style>{`:root { ${themeToCssVars(theme)} }`}</style>
    </>
  );
}
