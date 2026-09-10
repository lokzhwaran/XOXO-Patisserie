"use client";

import { useState } from "react";
import { paiseToRupeeDisplay } from "@/lib/money";
import { Button } from "@/components/ui/button";

interface ProductRow { code: string; name: string; units: number; revenue: number; cost: number; profit: number; }

export function ProductProfitabilityTable({ rows }: { rows: ProductRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 8);

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted-foreground)]">
          <tr><th className="p-3">Product</th><th className="p-3">Units</th><th className="p-3">Revenue</th><th className="p-3">Cost</th><th className="p-3">Profit</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="p-6 text-center text-[var(--color-muted-foreground)]">No paid orders in this range.</td></tr>
          ) : visible.map((p) => (
            <tr key={p.code} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-muted)]">
              <td className="p-3">{p.name} ({p.code})</td>
              <td className="p-3">{p.units}</td>
              <td className="p-3">{paiseToRupeeDisplay(p.revenue)}</td>
              <td className="p-3">{paiseToRupeeDisplay(p.cost)}</td>
              <td className="p-3">{paiseToRupeeDisplay(p.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && (
        <div className="border-t border-[var(--color-border)] p-3 text-center">
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : `Show all ${rows.length} products`}
          </Button>
        </div>
      )}
    </div>
  );
}
