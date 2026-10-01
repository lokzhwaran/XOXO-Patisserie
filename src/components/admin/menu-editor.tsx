"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
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
  images: string[];
  description: string;
  weightGrams: number;
  isVeg: boolean;
  hasOrders: boolean;
}

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/menu/images", { method: "POST", body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

/** Thumbnail strip with upload + remove. The first image is what the storefront card shows. */
function ImageManager({
  images,
  onChange,
  idPrefix,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadImage(file));
      }
      onChange([...images, ...uploaded].slice(0, 6));
      toast.success(uploaded.length > 1 ? `${uploaded.length} images uploaded` : "Image uploaded");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {images.map((url, index) => (
        <div key={url} className="group relative h-14 w-14 overflow-hidden rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange(images.filter((candidate) => candidate !== url))}
            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X className="h-2.5 w-2.5" />
          </button>
          {index === 0 && (
            <span className="absolute inset-x-0 bottom-0 bg-black/55 text-center text-[8px] font-semibold uppercase tracking-wide text-white">Main</span>
          )}
        </div>
      ))}
      <input
        ref={inputRef}
        id={`${idPrefix}-image-input`}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || images.length >= 6}
        onClick={() => inputRef.current?.click()}
        className="h-14 gap-1.5 px-3 text-xs"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        {busy ? "Uploading..." : images.length ? "Add" : "Add photo"}
      </Button>
    </div>
  );
}

export function MenuEditor({ products, categories }: { products: MenuProduct[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [saving, setSaving] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", code: "", categoryId: categories[0]?.id ?? "", sellingPriceRupees: "", costOfMakingRupees: "", weekdayMax: "", weekendMax: "", weightGrams: "", description: "", ingredients: "" });
  const [newImages, setNewImages] = useState<string[]>([]);

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
    const response = await fetch("/api/admin/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newProduct, images: newImages }) });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) { toast.error(data.error ?? "Could not add menu item"); return; }
    toast.success("Menu item added");
    setNewProduct({ ...newProduct, name: "", code: "", sellingPriceRupees: "", costOfMakingRupees: "", weekdayMax: "", weekendMax: "", weightGrams: "", description: "", ingredients: "" });
    setNewImages([]);
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
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 shadow-sm sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 lg:items-end">
        {(["name", "code", "sellingPriceRupees", "costOfMakingRupees", "weekdayMax", "weekendMax", "weightGrams"] as const).map((field) => (
          <div key={field}>
            <Label htmlFor={`new-${field}`} className="text-xs sm:text-sm">
              {field === "name" ? "Name" : field === "code" ? "Code" : field === "sellingPriceRupees" ? "Price (₹)" : field === "costOfMakingRupees" ? "Cost (₹)" : field === "weekdayMax" ? "Weekday limit" : field === "weekendMax" ? "Weekend limit" : "Weight (g)"}
            </Label>
            <Input id={`new-${field}`} type={field === "name" || field === "code" ? "text" : "number"} min="0" value={newProduct[field]} onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" />
          </div>
        ))}
        <div>
          <Label htmlFor="new-category" className="text-xs sm:text-sm">Category</Label>
          <select id="new-category" value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} className="h-9 sm:h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--color-foreground)]">
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2 md:col-span-4 lg:col-span-8">
          <Label className="text-xs sm:text-sm">Photos</Label>
          <div className="mt-1.5">
            <ImageManager images={newImages} onChange={setNewImages} idPrefix="new" />
          </div>
        </div>
        <Button disabled={saving === "new"} onClick={addProduct} className="h-9 sm:h-10 text-xs sm:text-sm sm:col-span-2 md:col-span-4 lg:col-span-8">
          {saving === "new" ? "Adding..." : "Add menu item"}
        </Button>
      </div>
      {rows.map((product) => (
        <div key={product.id} className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.9fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">{product.code}</p>
            <Label htmlFor={`name-${product.id}`} className="text-xs sm:text-sm">Menu item</Label>
            <Input id={`name-${product.id}`} value={product.name} onChange={(e) => update(product.id, { name: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor={`category-${product.id}`} className="text-xs sm:text-sm">Category</Label>
            <select id={`category-${product.id}`} value={product.categoryId} onChange={(e) => update(product.id, { categoryId: e.target.value })} className="h-9 sm:h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--color-foreground)]">
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          {(["sellingPricePaise", "costOfMakingPaise"] as const).map((field) => (
            <div key={field}>
              <Label htmlFor={`${field}-${product.id}`} className="text-xs sm:text-sm">{field === "sellingPricePaise" ? "Price (₹)" : "Cost (₹)"}</Label>
              <Input id={`${field}-${product.id}`} type="number" min="0" step="0.01" value={product[field] / 100} onChange={(e) => update(product.id, { [field]: Number(e.target.value) * 100 })} className="h-9 sm:h-10 text-xs sm:text-sm" />
            </div>
          ))}
          <div className="flex items-center gap-4 text-xs sm:text-sm sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-start lg:gap-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={product.isActive} onChange={(e) => update(product.id, { isActive: e.target.checked })} className="accent-[var(--color-primary)] rounded" /> Active</label>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={product.isFeatured} onChange={(e) => update(product.id, { isFeatured: e.target.checked })} className="accent-[var(--color-primary)] rounded" /> Featured</label>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <Button size="sm" disabled={saving === product.id} onClick={() => save(product)} className="h-8 sm:h-9 text-xs sm:text-sm">{saving === product.id ? "Saving..." : "Save"}</Button>
            <Button asChild size="sm" variant="outline" className="h-8 sm:h-9 text-xs"><Link href={`/admin/menu/capacity?product=${product.id}`}>Set capacity by date</Link></Button>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={() => removeProduct(product)} className="h-8 sm:h-9 text-xs">Remove from menu</Button>
              {product.hasOrders ? (
                <span className="text-[11px] text-[var(--color-muted-foreground)]" title="This item has past orders, so its order history can't be deleted. Use 'Remove from menu' above to take it off the customer menu instead.">Has past orders — use &quot;Remove from menu&quot; above</span>
              ) : (
                <Button size="sm" variant="danger" onClick={() => deleteProduct(product)} className="h-8 sm:h-9 text-xs">Delete permanently</Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:col-span-2 lg:col-span-6 lg:grid-cols-[auto_1fr_8rem]">
            <div>
              <Label className="text-xs sm:text-sm">Photos</Label>
              <div className="mt-1.5">
                <ImageManager
                  images={product.images}
                  onChange={(images) => update(product.id, { images })}
                  idPrefix={product.id}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`description-${product.id}`} className="text-xs sm:text-sm">Description</Label>
              <textarea
                id={`description-${product.id}`}
                value={product.description}
                onChange={(e) => update(product.id, { description: e.target.value })}
                rows={2}
                className="mt-1.5 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs sm:text-sm text-[var(--color-foreground)]"
              />
            </div>
            <div>
              <Label htmlFor={`weight-${product.id}`} className="text-xs sm:text-sm">Weight (g)</Label>
              <Input id={`weight-${product.id}`} type="number" min="0" value={product.weightGrams} onChange={(e) => update(product.id, { weightGrams: Number(e.target.value) })} className="mt-1.5 h-9 sm:h-10 text-xs sm:text-sm" />
              <label className="mt-2 flex items-center gap-1.5 text-xs cursor-pointer"><input type="checkbox" checked={product.isVeg} onChange={(e) => update(product.id, { isVeg: e.target.checked })} className="accent-[var(--color-success)] rounded" /> Veg</label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
