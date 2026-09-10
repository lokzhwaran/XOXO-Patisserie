"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const FORWARD_FLOW: Record<string, string | null> = {
  PENDING_PAYMENT: "CONFIRMED",
  CONFIRMED: "IN_PROGRESS",
  IN_PROGRESS: "BAKED",
  BAKED: "PACKED",
  PACKED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
  READY_FOR_PICKUP: "DELIVERED",
  CANCELLED: null,
  REFUNDED: null,
  PAYMENT_FAILED: null,
};

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const next = FORWARD_FLOW[status];
  const statuses = ["PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "BAKED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "READY_FOR_PICKUP", "CANCELLED", "REFUNDED", "PAYMENT_FAILED"];

  async function advance(toStatus: string, reason?: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, reason }),
      });
      if (!res.ok) throw new Error();
      setStatus(toStatus);
      toast.success(`Order moved to ${toStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  function cancelWithReason() {
    const reason = window.prompt("Reason for cancelling this order?", "");
    if (reason === null) return;
    advance("CANCELLED", reason);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="font-heading text-lg">Status: {status}</h2>
      <div className="mt-3 flex flex-col gap-2">
        <label className="text-xs text-[var(--color-muted-foreground)]" htmlFor="order-status">Set status</label>
        <select id="order-status" value={status} onChange={(event) => event.target.value === "CANCELLED" ? cancelWithReason() : advance(event.target.value)} disabled={loading} className="h-10 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm">
          {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        {next && (
          <Button disabled={loading} onClick={() => advance(next)}>
            Advance to {next}
          </Button>
        )}
        {status !== "CANCELLED" && (
          <Button variant="outline" disabled={loading} onClick={cancelWithReason}>
            Cancel order
          </Button>
        )}
      </div>
    </div>
  );
}
