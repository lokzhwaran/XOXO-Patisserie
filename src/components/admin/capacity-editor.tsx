"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CapacityCell {
  productId: string;
  date: string;
  maxQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  isBlocked: boolean;
  isOverridden: boolean;
}

export function CapacityEditor({ products, days, capacities }: { products: { id: string; code: string; name: string }[]; days: { date: string; label: string }[]; capacities: CapacityCell[] }) {
  const router = useRouter();
  const [cells, setCells] = useState(capacities);
  const [saving, setSaving] = useState<string | null>(null);
  const cellFor = (productId: string, date: string) => cells.find((cell) => cell.productId === productId && cell.date === date);

  async function save(cell: CapacityCell) {
    setSaving(`${cell.productId}_${cell.date}`);
    const response = await fetch("/api/admin/capacity", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cell) });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) { toast.error(data.error ?? "Could not update capacity"); return; }
    toast.success("Capacity updated");
    update(cell.productId, cell.date, { isOverridden: true });
    router.refresh();
  }

  function update(productId: string, date: string, patch: Partial<CapacityCell>) {
    setCells((current) => current.map((cell) => cell.productId === productId && cell.date === date ? { ...cell, ...patch } : cell));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted-foreground)]"><span className="rounded bg-[var(--color-success)]/15 px-2 py-1">Available</span><span className="rounded bg-[var(--color-warning)]/15 px-2 py-1">Half booked</span><span className="rounded bg-[var(--color-danger)]/15 px-2 py-1">Full or blocked</span><span className="rounded bg-[var(--color-muted)] px-2 py-1">Auto (from weekday/weekend default)</span><span className="rounded border border-[var(--color-border)] px-2 py-1">Manually set</span></div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full min-w-[1100px] text-xs">
          <thead><tr className="border-b border-[var(--color-border)]"><th className="sticky left-0 z-10 bg-[var(--color-surface)] p-3 text-left">Product</th>{days.map((day) => <th key={day.date} className="p-2 text-center">{day.label}</th>)}</tr></thead>
          <tbody>{products.map((product) => <tr key={product.id} className="border-b border-[var(--color-border)] last:border-0"><td className="sticky left-0 z-10 bg-[var(--color-surface)] p-3"><strong>{product.code}</strong><br /><span className="text-[var(--color-muted-foreground)]">{product.name}</span></td>{days.map((day) => { const cell = cellFor(product.id, day.date)!; const booked = cell.reservedQuantity + cell.soldQuantity; const ratio = cell.maxQuantity ? booked / cell.maxQuantity : 1; const tone = cell.isBlocked || ratio >= 1 ? "bg-[var(--color-danger)]/15" : ratio >= 0.5 ? "bg-[var(--color-warning)]/15" : "bg-[var(--color-success)]/15"; return <td key={day.date} className={`p-2 ${tone}`}><div className="flex flex-col items-center gap-1"><span className={cell.isOverridden ? "font-semibold" : ""} title={cell.isOverridden ? "Manually set for this date" : "Using weekday/weekend default"}>{booked}/{cell.maxQuantity}{!cell.isOverridden && <span className="ml-1 text-[10px] text-[var(--color-muted-foreground)]">auto</span>}</span><input aria-label={`${product.name} capacity ${day.label}`} type="number" min={booked} value={cell.maxQuantity} onChange={(e) => update(product.id, day.date, { maxQuantity: Number(e.target.value) })} className="w-14 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-1 text-center" /><label className="flex items-center gap-1"><input type="checkbox" checked={cell.isBlocked} onChange={(e) => update(product.id, day.date, { isBlocked: e.target.checked })} /> block</label><button type="button" disabled={saving === `${cell.productId}_${cell.date}`} onClick={() => save(cell)} className="text-[var(--color-primary)] underline">{saving === `${cell.productId}_${cell.date}` ? "..." : "Save"}</button></div></td>; })}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
