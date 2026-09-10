"use client";

import { useState } from "react";
import { toast } from "sonner";

export function AdminOrderingToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !enabled;
    try {
      const res = await fetch("/api/admin/settings/ordering-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordersEnabled: next }),
      });
      if (!res.ok) throw new Error();
      setEnabled(next);
      toast.success(next ? "Ordering is now ON" : "Ordering is now OFF");
    } catch {
      toast.error("Failed to update ordering status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        enabled ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
      }`}
    >
      <span className={`h-2 w-2 rounded-full transition-colors ${enabled ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`} />
      Ordering: {enabled ? "ON" : "OFF"}
    </button>
  );
}
