"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function OrderActions({ orderId, orderNumber, paymentStatus, adminNotes }: { orderId: string; orderNumber: string; paymentStatus: string; adminNotes: string }) {
  const router = useRouter();
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [notes, setNotes] = useState(adminNotes);
  const [loading, setLoading] = useState<string | null>(null);

  async function markPaid() {
    setLoading("mark-paid");
    const response = await fetch(`/api/admin/orders/${orderId}/mark-paid`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, reference }) });
    const data = await response.json();
    setLoading(null);
    if (!response.ok) { toast.error(data.error ?? "Could not mark order paid"); return; }
    toast.success("Order marked paid"); setMarkPaidOpen(false); router.refresh();
  }

  async function refund() {
    setLoading("refund");
    const response = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: refundReason }) });
    const data = await response.json();
    setLoading(null);
    if (!response.ok) { toast.error(data.error ?? "Could not process refund"); return; }
    toast.success("Order refunded"); setRefundOpen(false); router.refresh();
  }

  async function duplicate() {
    setLoading("duplicate");
    const response = await fetch(`/api/admin/orders/${orderId}/duplicate`, { method: "POST" });
    const data = await response.json();
    setLoading(null);
    if (!response.ok) { toast.error(data.error ?? "Could not duplicate order"); return; }
    toast.success(`Created order ${data.orderNumber}`);
    router.push(`/admin/orders/${data.orderNumber}`);
  }

  async function saveNotes() {
    setLoading("notes");
    const response = await fetch(`/api/admin/orders/${orderId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminNotes: notes }) });
    setLoading(null);
    if (!response.ok) { toast.error("Could not save notes"); return; }
    toast.success("Notes saved"); router.refresh();
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="font-heading text-lg">Actions</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href={`/api/orders/${orderNumber}/receipt`} target="_blank" rel="noreferrer">Print invoice</a></Button>
        <Button asChild variant="outline" size="sm"><a href={`/admin/orders/${orderNumber}/label`} target="_blank" rel="noreferrer">Print packing label</a></Button>
        <Button size="sm" variant="outline" disabled={loading === "duplicate"} onClick={duplicate}>{loading === "duplicate" ? "Duplicating..." : "Duplicate order"}</Button>
        {paymentStatus !== "PAID" && <Button size="sm" variant="outline" onClick={() => setMarkPaidOpen((open) => !open)}>Mark paid manually</Button>}
        {(paymentStatus === "PAID" || paymentStatus === "PARTIALLY_PAID") && <Button size="sm" variant="outline" onClick={() => setRefundOpen((open) => !open)}>Refund order</Button>}
      </div>

      {markPaidOpen && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
          <div><Label htmlFor="pay-method">Method</Label><select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"><option value="cash">Cash</option><option value="upi-direct">UPI (direct)</option><option value="bank-transfer">Bank transfer</option></select></div>
          <div><Label htmlFor="pay-reference">Reference note (optional)</Label><Input id="pay-reference" value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          <Button disabled={loading === "mark-paid"} onClick={markPaid}>{loading === "mark-paid" ? "Saving..." : "Confirm payment received"}</Button>
        </div>
      )}

      {refundOpen && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
          <div><Label htmlFor="refund-reason">Refund reason</Label><Textarea id="refund-reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></div>
          <Button variant="outline" disabled={loading === "refund" || !refundReason.trim()} onClick={refund}>{loading === "refund" ? "Processing..." : "Confirm refund"}</Button>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <Label htmlFor="admin-notes">Admin notes</Label>
        <Textarea id="admin-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button size="sm" className="mt-2" disabled={loading === "notes"} onClick={saveNotes}>{loading === "notes" ? "Saving..." : "Save notes"}</Button>
      </div>
    </div>
  );
}
