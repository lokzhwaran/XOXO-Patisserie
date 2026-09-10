"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { paiseToRupeeDisplay } from "@/lib/money";
import { toast } from "sonner";

const CATEGORIES = ["INGREDIENTS", "PACKAGING", "UTILITIES", "MARKETING", "DELIVERY", "OTHER"];
interface Expense { id: string; date: string; category: string; description: string; amountPaise: number; notes: string | null; }

export function ExpenseManager({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: "INGREDIENTS", description: "", amountRupees: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const visibleExpenses = expanded ? expenses : expenses.slice(0, 10);
  async function createExpense() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("Expense added");
      setForm({ ...form, description: "", amountRupees: "", notes: "" });
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add expense"); }
    finally { setSaving(false); }
  }
  async function removeExpense(id: string) {
    const response = await fetch("/api/admin/expenses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { toast.error("Could not remove expense"); return; }
    toast.success("Expense removed"); router.refresh();
  }
  return <div className="space-y-4">
    <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:grid-cols-5 md:items-end">
      <div><Label htmlFor="expense-date">Date</Label><Input id="expense-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
      <div><Label htmlFor="expense-category">Category</Label><select id="expense-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm">{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
      <div><Label htmlFor="expense-description">Description</Label><Input id="expense-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div><Label htmlFor="expense-amount">Amount (₹)</Label><Input id="expense-amount" type="number" min="0" step="0.01" value={form.amountRupees} onChange={(e) => setForm({ ...form, amountRupees: e.target.value })} /></div>
      <Button disabled={saving} onClick={createExpense}>{saving ? "Adding..." : "Add expense"}</Button>
      <div className="md:col-span-5"><Label htmlFor="expense-notes">Notes</Label><Textarea id="expense-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </div>
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"><table className="w-full text-sm"><thead className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted-foreground)]"><tr><th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Description</th><th className="p-3">Amount</th><th className="p-3">Action</th></tr></thead><tbody>{expenses.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-[var(--color-muted-foreground)]">No expenses in this range.</td></tr> : visibleExpenses.map((expense) => <tr key={expense.id} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-muted)]"><td className="p-3">{expense.date}</td><td className="p-3">{expense.category}</td><td className="p-3">{expense.description}</td><td className="p-3">{paiseToRupeeDisplay(expense.amountPaise)}</td><td className="p-3"><button type="button" onClick={() => removeExpense(expense.id)} className="text-[var(--color-danger)] underline">Remove</button></td></tr>)}</tbody></table>
      {expenses.length > 10 && (
        <div className="border-t border-[var(--color-border)] p-3 text-center">
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>{expanded ? "Show less" : `Show all ${expenses.length} expenses`}</Button>
        </div>
      )}
    </div>
  </div>;
}
