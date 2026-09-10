import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";
import { parseThemeJson } from "@/lib/theme";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.findFirstOrThrow();
  const theme = parseThemeJson(settings.theme);
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Settings</h1>
      <SettingsForm
        settings={{
          businessName: settings.businessName,
          tagline: settings.tagline,
          contactEmail: settings.contactEmail,
          whatsappNumber: settings.whatsappNumber,
          businessAddress: settings.businessAddress,
          fssaiNumber: settings.fssaiNumber,
          gstNumber: settings.gstNumber,
          instagramUrl: settings.instagramUrl ?? "",
          facebookUrl: settings.facebookUrl ?? "",
          logoUrl: settings.logoUrl ?? "",
          heroHeading: settings.heroHeading,
          heroSubheading: settings.heroSubheading,
          heroCtaLabel: settings.heroCtaLabel,
          aboutHeading: settings.aboutHeading,
          aboutCopy: settings.aboutCopy,
          footerCopy: settings.footerCopy,
          whyUsCopy: (settings.whyUsCopy as { title: string; body: string }[] | null) ?? [],
          testimonials: (settings.testimonials as { name: string; quote: string }[] | null) ?? [],
          faq: (settings.faq as { q: string; a: string }[] | null) ?? [],
          gstRatePercent: settings.gstRatePercent,
          packagingChargePaise: settings.packagingChargePaise,
          minOrderValuePaise: settings.minOrderValuePaise,
          orderingPausedMessage: settings.orderingPausedMessage,
          leadTimeHours: settings.leadTimeHours,
          nextAvailableDate: settings.nextAvailableDate?.toISOString().slice(0, 10) ?? "",
          nextAvailableMessage: settings.nextAvailableMessage ?? "",
          timeSlots: ((settings.timeSlots as string[] | null) ?? []).join(", "),
          serviceablePincodes: ((settings.serviceablePincodes as string[] | null) ?? []).join(", "),
          deliveryNote: settings.deliveryNote,
          deliveryBaseChargePaise: settings.deliveryBaseChargePaise,
          deliveryPerKmChargePaise: settings.deliveryPerKmChargePaise,
          freeDeliveryThresholdPaise: settings.freeDeliveryThresholdPaise !== null ? String(settings.freeDeliveryThresholdPaise / 100) : "",
          pickupAddress: settings.pickupAddress,
          tryAutoDeliveryBooking: settings.tryAutoDeliveryBooking,
          razorpayTestMode: settings.razorpayTestMode,
        }}
        theme={theme}
        razorpayConfigured={razorpayConfigured}
      />
    </div>
  );
}
