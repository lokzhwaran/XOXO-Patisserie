"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close cart"
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4 sm:p-5">
              <h2 className="font-heading text-lg sm:text-xl">Your Cart</h2>
              <motion.button
                whileTap={{ scale: 0.94 }}
                aria-label="Close"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-muted)] hover:bg-[var(--color-secondary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-[var(--color-muted-foreground)]">
                  <p className="text-sm sm:text-base">Your cart is empty.</p>
                  <Button asChild variant="primary" onClick={onClose}>
                    <Link href="/menu">Browse the menu</Link>
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col gap-3.5 sm:gap-4">
                  {items.map((item) => (
                    <motion.li
                      layout
                      key={`${item.productId}-${item.variantId}`}
                      className="flex gap-3 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-background)]/50 p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-base)] bg-[var(--color-muted)]">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="line-clamp-1 text-sm font-medium leading-snug">{item.name}</span>
                            <span className="mt-0.5 block text-[11px] text-[var(--color-muted-foreground)]">{item.code}</span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            aria-label="Remove item"
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 shadow-sm">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              aria-label="Decrease quantity"
                              onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full active:scale-95 transition-transform"
                            >
                              <Minus className="h-3 w-3" />
                            </motion.button>
                            <span className="w-4 text-center text-xs font-semibold">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              aria-label="Increase quantity"
                              onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full active:scale-95 transition-transform"
                            >
                              <Plus className="h-3 w-3" />
                            </motion.button>
                          </div>
                          <span className="text-xs font-semibold sm:text-sm">
                            {paiseToRupeeDisplay(item.unitPricePaise * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
                  <span className="text-base font-semibold">{paiseToRupeeDisplay(subtotal)}</span>
                </div>
                <Button asChild variant="primary" size="lg" className="w-full shadow-md transition-transform duration-200 hover:-translate-y-0.5" onClick={onClose}>
                  <Link href="/cart">View Cart & Checkout</Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
