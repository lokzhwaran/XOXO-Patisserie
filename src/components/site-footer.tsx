import Link from "next/link";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";
import type { SiteSettings } from "@prisma/client";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]">
      <div className="mx-auto max-w-(--container-max) px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
          <div>
            <h3 className="font-heading text-lg sm:text-xl">{settings.businessName}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed">{settings.footerCopy}</p>
            <div className="mt-4 flex gap-3">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="p-1 rounded-full hover:bg-[var(--color-surface)] transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="p-1 rounded-full hover:bg-[var(--color-surface)] transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Explore
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-xs sm:text-sm">
              <li><Link href="/menu" className="hover:text-[var(--color-primary)] transition-colors">Menu</Link></li>
              <li><Link href="/track" className="hover:text-[var(--color-primary)] transition-colors">Track my order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Contact
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" /> <span>{settings.businessAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <a href={`https://wa.me/${settings.whatsappNumber.replace("+", "")}`} className="hover:underline">{settings.whatsappNumber}</a>
              </li>
              <li className="text-[var(--color-muted-foreground)]">{settings.contactEmail}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Compliance
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-xs sm:text-sm text-[var(--color-muted-foreground)]">
              <li>FSSAI: {settings.fssaiNumber}</li>
              <li>GSTIN: {settings.gstNumber}</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 sm:mt-12 text-xs text-[var(--color-muted-foreground)] border-t border-[var(--color-border)]/60 pt-6">
          © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
