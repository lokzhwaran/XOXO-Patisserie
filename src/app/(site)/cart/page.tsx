"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paiseToRupeeDisplay } from "@/lib/money";
import { OrderingPausedModal } from "@/components/ordering-paused-modal";
import { toast } from "sonner";

interface SiteSettingsClient {
  gstRatePercent: number;
  packagingChargePaise: number;
  minOrderValuePaise: number;
  deliveryNote: string;
  ordersEnabled: boolean;
  orderingPausedMessage: string;
  nextAvailableMessage: string | null;
  whatsappNumber: string;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotalPaise());
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettingsClient | null>(null);
  const [showPausedModal, setShowPausedModal] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings/public")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  const gst = settings ? Math.round((subtotal * settings.gstRatePercent) / 100) : 0;
  const packaging = settings?.packagingChargePaise ?? 0;
  const total = subtotal + gst + packaging;
  const belowMin = settings ? total < settings.minOrderValuePaise && items.length > 0 : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl sm:text-4xl">Your Cart</h1>

      {items.length === 0 ? (
        <div className="mt-12 sm:mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-[var(--color-muted-foreground)]">Your cart is empty.</p>
          <Button asChild variant="primary">
            <Link href="/menu">Browse the menu</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="flex flex-col divide-y divide-[var(--color-border)] p-0">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4">
                    <div className="flex items-start gap-3 sm:contents">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-[var(--radius-base)] bg-[var(--color-muted)]">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base leading-snug">{item.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{item.code}</p>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[var(--color-muted-foreground)]">{paiseToRupeeDisplay(item.unitPricePaise)} each</p>
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1 sm:hidden text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between sm:gap-4 pt-1 sm:pt-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] active:scale-95"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-right font-medium text-sm sm:text-base sm:w-24">
                        {paiseToRupeeDisplay(item.unitPricePaise * item.quantity)}
                      </p>
                      <button
                        aria-label="Remove item"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="hidden sm:inline-flex text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{paiseToRupeeDisplay(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({settings?.gstRatePercent ?? 5}%)</span>
                  <span>{paiseToRupeeDisplay(gst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Packaging</span>
                  <span>{paiseToRupeeDisplay(packaging)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--color-border)] pt-3 font-heading text-lg">
                  <span>Total</span>
                  <span>{paiseToRupeeDisplay(total)}</span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">{settings?.deliveryNote}</p>
                {belowMin && (
                  <p className="text-xs text-[var(--color-danger)]">
                    Minimum order value is {paiseToRupeeDisplay(settings!.minOrderValuePaise)}. Please add more items.
                  </p>
                )}
                <Button
                  size="lg"
                  className="mt-2 w-full"
                  disabled={belowMin}
                  onClick={() => {
                    if (settings && !settings.ordersEnabled) {
                      setShowPausedModal(true);
                      return;
                    }
                    if (belowMin) {
                      toast.error("Add more items to meet the minimum order value.");
                      return;
                    }
                    router.push("/checkout/details");
                  }}
                >
                  Place an Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {showPausedModal && settings && (
        <OrderingPausedModal
          message={settings.orderingPausedMessage}
          nextAvailableMessage={settings.nextAvailableMessage}
          whatsappNumber={settings.whatsappNumber}
          onClose={() => setShowPausedModal(false)}
        />
      )}
    </div>
  );
}
