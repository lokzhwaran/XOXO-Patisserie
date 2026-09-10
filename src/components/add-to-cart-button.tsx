"use client";

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
      <Button variant="outline" size="sm" onClick={() => onBlockedAdd?.()}>
        Ordering paused
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!soldOut && (
        <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] px-1">
          <button
            aria-label="Decrease"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-sm">{qty}</span>
          <button
            aria-label="Increase"
            onClick={() => setQty((q) => Math.min(available, q + 1))}
            className="flex h-8 w-8 items-center justify-center"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
      <Button
        variant={soldOut ? "outline" : "primary"}
        size="sm"
        disabled={soldOut}
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
        {soldOut ? "Sold out for today" : "Add to cart"}
      </Button>
    </div>
  );
}
