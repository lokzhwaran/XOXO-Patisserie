import type { Metadata } from "next";
import { Toaster } from "sonner";
import { getHeroImageUrl, getSiteSettings, ThemeStyleTag } from "@/lib/site-settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloatButton } from "@/components/whatsapp-float-button";
import "../globals.css";

// The whole site reads live data (settings, inventory, orders) from the DB on every request —
// never statically prerendered — so admin changes and stock levels are always accurate.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const heroImageUrl = getHeroImageUrl(settings.heroImageUrl);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: `${settings.businessName} — ${settings.tagline}`,
    description: settings.tagline,
    icons: settings.faviconUrl ? [{ url: settings.faviconUrl }] : undefined,
    openGraph: {
      title: settings.businessName,
      description: settings.tagline,
      images: [heroImageUrl],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <head>
        <ThemeStyleTag settings={settings} />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
        <SiteHeader businessName={settings.businessName} logoUrl={settings.logoUrl} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
        <WhatsAppFloatButton whatsappNumber={settings.whatsappNumber} />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
