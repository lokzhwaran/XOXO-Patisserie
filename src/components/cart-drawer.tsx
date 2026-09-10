"use client";

import Link from "next/link";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { paiseToRupeeDisplay } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotalPaise());

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close cart" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <h2 className="font-heading text-xl">Your Cart</h2>
          <button aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[var(--color-muted-foreground)]">
              <p>Your cart is empty.</p>
              <Button asChild variant="primary" onClick={onClose}>
                <Link href="/menu">Browse the menu</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-base)] bg-[var(--color-muted)]">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{item.code}</span>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-medium">
                        {paiseToRupeeDisplay(item.unitPricePaise * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    aria-label="Remove item"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="self-start text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--color-border)] p-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
              <span className="font-semibold">{paiseToRupeeDisplay(subtotal)}</span>
            </div>
            <Button asChild variant="primary" size="lg" className="w-full" onClick={onClose}>
              <Link href="/cart">View Cart & Checkout</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
