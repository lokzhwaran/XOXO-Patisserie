"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { OrderingPausedModal } from "@/components/ordering-paused-modal";
import type { ProductForCard } from "@/lib/products-types";

export function FeaturedProductsGrid({
  products,
  availability,
  ordersEnabled,
  pausedMessage,
  nextAvailableMessage,
  whatsappNumber,
}: {
  products: ProductForCard[];
  availability: Record<string, number>;
  ordersEnabled: boolean;
  pausedMessage: string;
  nextAvailableMessage: string | null;
  whatsappNumber: string;
}) {
  const [showPausedModal, setShowPausedModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            available={availability[p.id] ?? 0}
            ordersEnabled={ordersEnabled}
            onBlockedAdd={() => setShowPausedModal(true)}
          />
        ))}
      </div>
      {showPausedModal && (
        <OrderingPausedModal
          message={pausedMessage}
          nextAvailableMessage={nextAvailableMessage}
          whatsappNumber={whatsappNumber}
          onClose={() => setShowPausedModal(false)}
        />
      )}
    </>
  );
}
