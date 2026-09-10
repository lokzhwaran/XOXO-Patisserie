"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { OrderingPausedModal } from "@/components/ordering-paused-modal";
import type { ProductForCard } from "@/lib/products-types";

interface MenuProduct extends ProductForCard {
  categoryId: string;
}

export function MenuClient({
  products,
  categories,
  availability,
  ordersEnabled,
  pausedMessage,
  nextAvailableMessage,
  whatsappNumber,
}: {
  products: MenuProduct[];
  categories: { id: string; name: string }[];
  availability: Record<string, number>;
  ordersEnabled: boolean;
  pausedMessage: string;
  nextAvailableMessage: string | null;
  whatsappNumber: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState<"popularity" | "price-asc" | "price-desc">("popularity");
  const [showPausedModal, setShowPausedModal] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") list = list.filter((p) => p.categoryId === activeCategory);
    if (vegOnly) list = list.filter((p) => p.isVeg);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.sellingPricePaise - b.sellingPricePaise);
    else if (sort === "price-desc") list.sort((a, b) => b.sellingPricePaise - a.sellingPricePaise);
    else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    return list;
  }, [products, activeCategory, vegOnly, search, sort]);

  return (
    <>
      {!ordersEnabled && (
        <div className="mt-4 sm:mt-6 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 sm:p-4 text-xs sm:text-sm">
          We&apos;re not taking orders right now. Feel free to browse — {pausedMessage}
        </div>
      )}
      <div className="sticky top-16 sm:top-20 z-20 -mx-4 mt-6 sm:mt-8 flex flex-col gap-3 border-b border-[var(--color-border)]/60 bg-[var(--color-background)]/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:border-none sm:px-0 sm:py-4">
        {/* Horizontal Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeCategory === "all" ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm" : "bg-[var(--color-muted)] hover:bg-[var(--color-secondary)]"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                activeCategory === c.id ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm" : "bg-[var(--color-muted)] hover:bg-[var(--color-secondary)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              placeholder="Search bakes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 sm:h-11 pl-8 sm:pl-9 text-xs sm:text-sm"
            />
          </div>

          <label className="flex items-center gap-1.5 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[var(--color-success)]"
            />
            <span className="font-medium text-xs sm:text-sm">Veg only</span>
          </label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort products"
            className="h-9 sm:h-11 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm"
          >
            <option value="popularity">Popularity</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 sm:py-24 text-center text-sm sm:text-base text-[var(--color-muted-foreground)]">
          No products match your filters. Try clearing a filter above.
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, index) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}>
              <ProductCard product={p} available={availability[p.id] ?? 0} ordersEnabled={ordersEnabled} onBlockedAdd={() => setShowPausedModal(true)} />
            </motion.div>
          ))}
        </div>
      )}
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
