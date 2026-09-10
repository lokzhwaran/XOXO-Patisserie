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
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4 text-sm">
          We&apos;re not taking orders right now. Feel free to browse — {pausedMessage}
        </div>
      )}
      <div className="sticky top-20 z-20 -mx-4 mt-8 flex flex-wrap items-center gap-3 bg-[var(--color-background)] px-4 py-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeCategory === "all" ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "bg-[var(--color-muted)]"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeCategory === c.id ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "bg-[var(--color-muted)]"
            }`}
          >
            {c.name}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
          Veg only
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="ml-auto rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="popularity">Popularity</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input placeholder="Search menu" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-[var(--color-muted-foreground)]">
          No products match your filters. Try clearing a filter above.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
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
