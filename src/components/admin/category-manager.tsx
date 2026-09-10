"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "sonner";

interface Category { id: string; name: string; sortOrder: number; isActive: boolean; }
export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  async function add() {
    setSaving(true);
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { toast.error(data.error ?? "Could not add category"); return; }
    setName(""); toast.success("Category added"); router.refresh();
  }
  async function update(category: Category) {
    const response = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(category) });
    const data = await response.json();
    if (!response.ok) { toast.error(data.error ?? "Could not update category"); return; }
    toast.success("Category updated"); router.refresh();
  }
  return <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"><div className="flex items-end gap-3"><div className="max-w-sm flex-1"><Label htmlFor="new-category">Add category</Label><Input id="new-category" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seasonal specials" /></div><Button disabled={saving || !name.trim()} onClick={add}>Add</Button></div><div className="grid gap-2 md:grid-cols-2">{categories.map((category) => <CategoryRow key={category.id} category={category} onSave={update} />)}</div></div>;
}
function CategoryRow({ category, onSave }: { category: Category; onSave: (category: Category) => void }) {
  const [value, setValue] = useState(category);
  return <div className="flex items-center gap-2 rounded-[var(--radius-base)] border border-[var(--color-border)] p-2"><Input aria-label="Category name" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /><Input aria-label="Sort order" type="number" min="0" value={value.sortOrder} onChange={(e) => setValue({ ...value, sortOrder: Number(e.target.value) })} className="w-20" /><label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={value.isActive} onChange={(e) => setValue({ ...value, isActive: e.target.checked })} /> active</label><Button size="sm" variant="outline" onClick={() => onSave(value)}>Save</Button></div>;
}
