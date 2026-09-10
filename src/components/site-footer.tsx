import Link from "next/link";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";
import type { SiteSettings } from "@prisma/client";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]">
      <div className="mx-auto max-w-(--container-max) px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="font-heading text-xl">{settings.businessName}</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{settings.footerCopy}</p>
            <div className="mt-4 flex gap-3">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Explore
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li><Link href="/menu">Menu</Link></li>
              <li><Link href="/track">Track my order</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Contact
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {settings.businessAddress}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`https://wa.me/${settings.whatsappNumber.replace("+", "")}`}>{settings.whatsappNumber}</a>
              </li>
              <li>{settings.contactEmail}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Compliance
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-muted-foreground)]">
              <li>FSSAI: {settings.fssaiNumber}</li>
              <li>GSTIN: {settings.gstNumber}</li>
            </ul>
          </div>
        </div>
        <p className="mt-12 text-xs text-[var(--color-muted-foreground)]">
          © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
