"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  code: string;
  image: string | null;
  unitPricePaise: number;
  quantity: number;
  maxQuantity?: number;
}

interface CartState {
  items: CartItem[];
  requestedDate: string | null; // ISO date (yyyy-MM-dd)
  savedAt: number;
  addItem: (item: CartItem) => number;
  removeItem: (productId: string, variantId: string | null) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  setRequestedDate: (date: string) => void;
  clear: () => void;
  subtotalPaise: () => number;
  totalItemCount: () => number;
}

const CART_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      requestedDate: null,
      savedAt: Date.now(),
      addItem: (item) => {
        let addedQuantity = 0;
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          const maxQuantity = item.maxQuantity ?? existing?.maxQuantity;
          const currentQuantity = existing?.quantity ?? 0;
          const nextQuantity = maxQuantity === undefined
            ? currentQuantity + item.quantity
            : Math.min(maxQuantity, currentQuantity + item.quantity);
          addedQuantity = Math.max(0, nextQuantity - currentQuantity);
          if (nextQuantity <= currentQuantity) return state;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing ? { ...i, quantity: nextQuantity, maxQuantity } : i
              ),
              savedAt: Date.now(),
            };
          }
          return { items: [{ ...item, quantity: addedQuantity, maxQuantity }, ...state.items], savedAt: Date.now() };
        });
        return addedQuantity;
      },
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
          savedAt: Date.now(),
        })),
      setQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.variantId === variantId)
                )
              : state.items.map((i) =>
                  i.productId === productId && i.variantId === variantId
                  ? { ...i, quantity: i.maxQuantity === undefined ? quantity : Math.min(i.maxQuantity, quantity) }
                    : i
                ),
          savedAt: Date.now(),
        })),
      setRequestedDate: (date) => set({ requestedDate: date }),
      clear: () => set({ items: [], savedAt: Date.now() }),
      subtotalPaise: () =>
        get().items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0),
      totalItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "xoxobakery-cart",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state && Date.now() - state.savedAt > CART_EXPIRY_MS) {
          state.items = [];
        }
      },
    }
  )
);
