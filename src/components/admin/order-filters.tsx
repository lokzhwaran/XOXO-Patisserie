"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "BAKED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "READY_FOR_PICKUP", "CANCELLED", "REFUNDED", "PAYMENT_FAILED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "PARTIALLY_PAID", "FAILED", "REFUNDED"];
const FULFILMENT_TYPES = ["DELIVERY", "PICKUP"];

export function OrderFilters({
  search,
  status,
  paymentStatus,
  fulfilmentType,
  from,
  to,
}: {
  search: string;
  status: string;
  paymentStatus: string;
  fulfilmentType: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ search, status, paymentStatus, fulfilmentType, from, to });

  function apply() {
    const query = new URLSearchParams();
    if (form.search.trim()) query.set("search", form.search.trim());
    if (form.status) query.set("status", form.status);
    if (form.paymentStatus) query.set("paymentStatus", form.paymentStatus);
    if (form.fulfilmentType) query.set("fulfilmentType", form.fulfilmentType);
    if (form.from) query.set("from", form.from);
    if (form.to) query.set("to", form.to);
    router.push(`/admin/orders${query.toString() ? `?${query.toString()}` : ""}`);
  }

  function clear() {
    setForm({ search: "", status: "", paymentStatus: "", fulfilmentType: "", from: "", to: "" });
    router.push("/admin/orders");
  }

  return (
    <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2 lg:col-span-2">
        <Label htmlFor="order-search" className="text-xs sm:text-sm">Search (name / phone / order ID)</Label>
        <Input id="order-search" placeholder="Search orders..." value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} onKeyDown={(e) => e.key === "Enter" && apply()} className="h-9 sm:h-10 text-xs sm:text-sm" />
      </div>
      <div>
        <Label htmlFor="order-status-filter" className="text-xs sm:text-sm">Status</Label>
        <select id="order-status-filter" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 sm:h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--color-foreground)]">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="order-payment-filter" className="text-xs sm:text-sm">Payment</Label>
        <select id="order-payment-filter" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className="h-9 sm:h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--color-foreground)]">
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="order-fulfilment-filter" className="text-xs sm:text-sm">Fulfilment</Label>
        <select id="order-fulfilment-filter" value={form.fulfilmentType} onChange={(e) => setForm({ ...form, fulfilmentType: e.target.value })} className="h-9 sm:h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--color-foreground)]">
          <option value="">All Fulfilment</option>
          {FULFILMENT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button size="sm" onClick={apply} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm">Filter</Button>
        <Button size="sm" variant="outline" onClick={clear} className="h-9 sm:h-10 text-xs sm:text-sm">Clear</Button>
      </div>
      <div>
        <Label htmlFor="order-from" className="text-xs sm:text-sm">From date</Label>
        <Input id="order-from" type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" />
      </div>
      <div>
        <Label htmlFor="order-to" className="text-xs sm:text-sm">To date</Label>
        <Input id="order-to" type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" />
      </div>
    </div>
  );
}
