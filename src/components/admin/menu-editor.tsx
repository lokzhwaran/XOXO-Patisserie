"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "sonner";

interface MenuProduct {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  sellingPricePaise: number;
  costOfMakingPaise: number;
  weekdayMax: number;
  weekendMax: number;
  isActive: boolean;
  isFeatured: boolean;
  hasOrders: boolean;
}

export function MenuEditor({ products, categories }: { products: MenuProduct[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [saving, setSaving] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", code: "", categoryId: categories[0]?.id ?? "", sellingPriceRupees: "", costOfMakingRupees: "", weekdayMax: "", weekendMax: "", weightGrams: "", description: "", ingredients: "" });

  function update(id: string, patch: Partial<MenuProduct>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  async function save(product: MenuProduct) {
    setSaving(product.id);
    const response = await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...product,
        sellingPriceRupees: product.sellingPricePaise / 100,
        costOfMakingRupees: product.costOfMakingPaise / 100,
      }),
    });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) {
      toast.error(data.error ?? "Could not save menu item");
      return;
    }
    toast.success(`${product.name} updated`);
    router.refresh();
  }

  async function addProduct() {
    setSaving("new");
    const response = await fetch("/api/admin/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newProduct) });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) { toast.error(data.error ?? "Could not add menu item"); return; }
    toast.success("Menu item added");
    setNewProduct({ ...newProduct, name: "", code: "", sellingPriceRupees: "", costOfMakingRupees: "", weekdayMax: "", weekendMax: "", weightGrams: "", description: "", ingredients: "" });
    router.refresh();
  }

  async function removeProduct(product: MenuProduct) {
    if (!window.confirm(`Remove ${product.name} from the customer-facing menu? You can bring it back later by re-activating it.`)) return;
    const response = await fetch("/api/admin/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, mode: "soft" }) });
    if (!response.ok) { toast.error("Could not remove menu item"); return; }
    toast.success(`${product.name} removed from the customer menu`); router.refresh();
  }

  async function deleteProduct(product: MenuProduct) {
    if (!window.confirm(`Permanently delete ${product.name}? This cannot be undone.`)) return;
    const response = await fetch("/api/admin/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, mode: "hard" }) });
    const data = await response.json();
    if (!response.ok) { toast.error(data.error ?? "Could not delete menu item"); return; }
    toast.success(`${product.name} deleted`); router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:grid-cols-4 lg:grid-cols-8 lg:items-end">
        {(["name", "code", "sellingPriceRupees", "costOfMakingRupees", "weekdayMax", "weekendMax", "weightGrams"] as const).map((field) => <div key={field}><Label htmlFor={`new-${field}`}>{field === "name" ? "Name" : field === "code" ? "Code" : field === "sellingPriceRupees" ? "Price (₹)" : field === "costOfMakingRupees" ? "Cost (₹)" : field === "weekdayMax" ? "Weekday limit" : field === "weekendMax" ? "Weekend limit" : "Weight (g)"}</Label><Input id={`new-${field}`} type={field === "name" || field === "code" ? "text" : "number"} min="0" value={newProduct[field]} onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })} /></div>)}
        <div><Label htmlFor="new-category">Category</Label><select id="new-category" value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} className="h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <Button disabled={saving === "new"} onClick={addProduct}>{saving === "new" ? "Adding..." : "Add menu item"}</Button>
      </div>
      {rows.map((product) => (
        <div key={product.id} className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.9fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">{product.code}</p>
            <Label htmlFor={`name-${product.id}`}>Menu item</Label>
            <Input id={`name-${product.id}`} value={product.name} onChange={(e) => update(product.id, { name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor={`category-${product.id}`}>Category</Label>
            <select id={`category-${product.id}`} value={product.categoryId} onChange={(e) => update(product.id, { categoryId: e.target.value })} className="h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm">
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          {(["sellingPricePaise", "costOfMakingPaise"] as const).map((field) => (
            <div key={field}>
              <Label htmlFor={`${field}-${product.id}`}>{field === "sellingPricePaise" ? "Price (₹)" : "Cost (₹)"}</Label>
              <Input id={`${field}-${product.id}`} type="number" min="0" step="0.01" value={product[field] / 100} onChange={(e) => update(product.id, { [field]: Number(e.target.value) * 100 })} />
            </div>
          ))}
          <div className="flex items-center gap-3 text-sm lg:flex-col lg:items-start">
            <label><input type="checkbox" checked={product.isActive} onChange={(e) => update(product.id, { isActive: e.target.checked })} /> Active</label>
            <label><input type="checkbox" checked={product.isFeatured} onChange={(e) => update(product.id, { isFeatured: e.target.checked })} /> Featured</label>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" disabled={saving === product.id} onClick={() => save(product)}>{saving === product.id ? "Saving..." : "Save"}</Button>
            <Button asChild size="sm" variant="outline"><Link href={`/admin/menu/capacity?product=${product.id}`}>Set capacity by date</Link></Button>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={() => removeProduct(product)}>Remove from menu</Button>
              {product.hasOrders ? (
                <span className="text-xs text-[var(--color-muted-foreground)]" title="This item has past orders, so its order history can't be deleted. Use 'Remove from menu' above to take it off the customer menu instead.">Has past orders — use &quot;Remove from menu&quot; above, not delete</span>
              ) : (
                <Button size="sm" variant="danger" onClick={() => deleteProduct(product)}>Delete permanently</Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
