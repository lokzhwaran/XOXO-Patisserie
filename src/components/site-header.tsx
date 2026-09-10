"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu as MenuIcon, X, Search, Heart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./cart-drawer";

export function SiteHeader({ businessName, logoUrl }: { businessName: string; logoUrl: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.totalItemCount());
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isHome
            ? "border-b border-[var(--color-border)]/80 bg-[var(--color-background)]/95 shadow-[0_8px_24px_rgba(36,24,17,0.08)] backdrop-blur-xl"
            : "border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-16 sm:h-20 max-w-(--container-max) items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={businessName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-white/30" />
            ) : (
              <Heart
                className="h-3.5 w-3.5 text-[var(--color-accent)]"
                fill="currentColor"
              />
            )}
            <span
              className="font-heading text-base sm:text-lg tracking-wide text-[var(--color-foreground)]"
            >
              {businessName}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/menu"
              className="text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
            >
              Menu
            </Link>
            <Link
              href="/track"
              className="text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
            >
              Track Order
            </Link>
            <Button asChild variant="primary" size="md" className="shadow-sm shadow-black/10">
              <Link href="/menu">Order Now</Link>
            </Button>
            <button
              aria-label="Open cart"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)] transition-colors hover:bg-[var(--color-secondary)]"
            >
              <ShoppingBag className="h-5 w-5 text-[var(--color-foreground)]" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-semibold text-white ring-2 ring-[var(--color-background)]">
                  {itemCount}
                </span>
              )}
            </button>
          </nav>

          <div className="flex items-center gap-2.5 md:hidden">
            <button
              aria-label="Open cart"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)] active:scale-95 transition-transform"
            >
              <ShoppingBag className="h-5 w-5 text-[var(--color-foreground)]" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[9px] font-semibold text-white ring-2 ring-[var(--color-background)]">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)] active:scale-95 transition-transform md:hidden"
            >
              <MenuIcon className="h-5 w-5 text-[var(--color-foreground)]" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)] p-5 md:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-[var(--color-accent)]" fill="currentColor" />
              <span className="font-heading text-lg text-[var(--color-foreground)]">{businessName}</span>
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-3">
            <Link
              href="/menu"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between rounded-2xl p-4 text-base font-medium transition-colors ${
                pathname === "/menu"
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)]"
              }`}
            >
              <span>Browse Menu</span>
              <span className="text-xs opacity-70">Fresh Bakes →</span>
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between rounded-2xl p-4 text-base font-medium transition-colors ${
                pathname === "/track"
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)]"
              }`}
            >
              <span>Track Order</span>
              <span className="text-xs opacity-70">Live Status →</span>
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between rounded-2xl p-4 text-base font-medium transition-colors ${
                pathname === "/cart"
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)]"
              }`}
            >
              <span>Your Cart</span>
              <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-secondary-foreground)]">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <Button asChild variant="primary" size="lg" className="w-full shadow-md" onClick={() => setMobileOpen(false)}>
              <Link href="/menu">Order Fresh Bakes Now</Link>
            </Button>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <div className="sr-only">
        <Search />
      </div>
    </>
  );
}
