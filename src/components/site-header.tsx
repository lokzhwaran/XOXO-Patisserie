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

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isHome
            ? "absolute border-b border-[var(--color-border)]/80 bg-[var(--color-background)]/95 shadow-[0_8px_24px_rgba(36,24,17,0.08)] backdrop-blur-xl"
            : "border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-(--container-max) items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={businessName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30" />
            ) : (
              <Heart
                className={`h-3.5 w-3.5 ${isHome ? "text-[var(--color-accent)]" : "text-[var(--color-accent)]"}`}
                fill="currentColor"
              />
            )}
            <span
              className="font-heading text-lg tracking-wide text-[var(--color-foreground)]"
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

          <div className="flex items-center gap-3 md:hidden">
            <button aria-label="Open cart" onClick={() => setCartOpen(true)} className="relative">
              <ShoppingBag className="h-6 w-6 text-[var(--color-foreground)]" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[9px] font-semibold text-white ring-2 ring-[var(--color-background)]">
                  {itemCount}
                </span>
              )}
            </button>
            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded-full bg-[var(--color-muted)] p-2 md:hidden">
              <MenuIcon className="h-5 w-5 text-[var(--color-foreground)]" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--color-background)] p-6 md:hidden">
          <div className="flex justify-end">
            <button aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-5 text-lg">
            <Link href="/menu" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[var(--color-muted)] px-4 py-3">Menu</Link>
            <Link href="/track" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[var(--color-muted)] px-4 py-3">Track Order</Link>
            <Link href="/cart" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[var(--color-muted)] px-4 py-3">Cart</Link>
          </nav>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <div className="sr-only">
        <Search />
      </div>
    </>
  );
}
