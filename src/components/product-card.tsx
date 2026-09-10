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
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone="neutral">{product.code}</Badge>
          {product.isVeg && <Badge tone="success">Veg</Badge>}
        </div>
        {lowStock && (
          <div className="absolute bottom-3 left-3">
            <Badge tone="warning">Only {available} left today</Badge>
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge tone="danger">Sold out for today</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-heading text-lg">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-[var(--color-muted-foreground)]">{product.description}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-[var(--color-muted-foreground)]">{product.weightGrams}g</span>
          <span className="font-heading text-lg">{paiseToRupeeDisplay(product.sellingPricePaise)}</span>
        </div>
        <div className="mt-2">
          <AddToCartButton product={product} available={available} ordersEnabled={ordersEnabled} onBlockedAdd={onBlockedAdd} />
        </div>
      </div>
    </Card>
  );
}
