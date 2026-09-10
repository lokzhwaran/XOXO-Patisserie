import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { paiseToRupeeDisplay } from "@/lib/money";
import type { ProductForCard } from "@/lib/products-types";

export function ProductCard({ product, available, ordersEnabled = true, onBlockedAdd }: { product: ProductForCard; available: number; ordersEnabled?: boolean; onBlockedAdd?: () => void }) {
  const soldOut = available <= 0;
  const lowStock = available > 0 && available <= 3;

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-[var(--color-muted)]">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "grayscale opacity-60" : ""}`}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}
        <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex gap-1.5 sm:gap-2">
          <Badge tone="neutral" className="px-1.5 py-0.5 text-[10px] sm:text-xs">{product.code}</Badge>
          {product.isVeg && <Badge tone="success" className="px-1.5 py-0.5 text-[10px] sm:text-xs">Veg</Badge>}
        </div>
        {lowStock && (
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
            <Badge tone="warning" className="px-1.5 py-0.5 text-[10px] sm:text-xs">Only {available} left</Badge>
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-2 text-center">
            <Badge tone="danger" className="text-[10px] sm:text-xs">Sold out</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
        <div>
          <h3 className="font-heading text-sm sm:text-base md:text-lg leading-snug line-clamp-1 sm:line-clamp-2">{product.name}</h3>
          <p className="mt-1 line-clamp-1 sm:line-clamp-2 text-xs sm:text-sm text-[var(--color-muted-foreground)]">{product.description}</p>
        </div>
        <div>
          <div className="mt-1 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-[var(--color-muted-foreground)]">{product.weightGrams}g</span>
            <span className="font-heading text-sm sm:text-base md:text-lg font-semibold">{paiseToRupeeDisplay(product.sellingPricePaise)}</span>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <AddToCartButton product={product} available={available} ordersEnabled={ordersEnabled} onBlockedAdd={onBlockedAdd} />
          </div>
        </div>
      </div>
    </Card>
  );
}
