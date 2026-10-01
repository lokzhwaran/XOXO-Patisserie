"use client";

import { motion } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import type { ProductForCard } from "@/lib/products-types";
import { paiseToRupeeDisplay } from "@/lib/money";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export function AddToCartButton({ product, available, ordersEnabled = true, onBlockedAdd }: { product: ProductForCard; available: number; ordersEnabled?: boolean; onBlockedAdd?: () => void }) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const soldOut = available <= 0;

  if (!ordersEnabled) {
    return (
      <Button variant="outline" size="sm" className="w-full text-xs transition-transform duration-200 hover:-translate-y-0.5" onClick={() => onBlockedAdd?.()}>
        Paused
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {!soldOut && (
        <motion.div layout className="flex h-8 shrink-0 items-center gap-0.5 sm:gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-1 shadow-sm">
          <motion.button
            whileTap={{ scale: 0.93 }}
            aria-label="Decrease"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--color-muted)] transition-colors"
          >
            <Minus className="h-3 w-3" />
          </motion.button>
          <span className="w-4 sm:w-5 text-center text-xs sm:text-sm font-medium">{qty}</span>
          <motion.button
            whileTap={{ scale: 0.93 }}
            aria-label="Increase"
            onClick={() => setQty((q) => Math.min(available, q + 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--color-muted)] transition-colors"
          >
            <Plus className="h-3 w-3" />
          </motion.button>
        </motion.div>
      )}
      <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
        <Button
          variant={soldOut ? "outline" : "primary"}
          size="sm"
          disabled={soldOut}
          className="flex-1 h-8 w-full text-xs sm:text-sm px-2.5 sm:px-4 sm:h-9 transition-transform duration-200 hover:-translate-y-0.5"
          onClick={() => {
            const addedQuantity = addItem({
              productId: product.id,
              variantId: null,
              name: product.name,
              code: product.code,
              image: product.images[0] ?? null,
              unitPricePaise: product.sellingPricePaise,
              quantity: qty,
              maxQuantity: available,
            });
            if (addedQuantity === 0) {
              toast.error(`Only ${available} × ${product.name} available for today`);
              return;
            }
            toast.success(`Added ${addedQuantity} × ${product.name} — ${paiseToRupeeDisplay(product.sellingPricePaise * addedQuantity)}`);
            setQty(1);
          }}
        >
          {soldOut ? "Sold out" : "Add"}
        </Button>
      </motion.div>
    </div>
  );
}
