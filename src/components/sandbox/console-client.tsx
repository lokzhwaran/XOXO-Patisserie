"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { paiseToRupeeDisplay } from "@/lib/money";
import { toast } from "sonner";

interface OutboxItem {
  id: string;
  channel: string;
  templateKey: string;
  to: string;
  subject: string | null;
  body: string;
  createdAt: string;
}
interface SandboxEventItem {
  id: string;
  eventType: string;
  refId: string;
  payload: unknown;
  createdAt: string;
}
interface PendingOrder {
  orderNumber: string;
  totalPaise: number;
  razorpayOrderId: string | null;
}

export function SandboxConsoleClient({
  outbox,
  paymentEvents,
  deliveryEvents,
  pendingOrders,
}: {
  outbox: OutboxItem[];
  paymentEvents: SandboxEventItem[];
  deliveryEvents: SandboxEventItem[];
  pendingOrders: PendingOrder[];
}) {
  const [tab, setTab] = useState<"status" | "notifications" | "payments" | "delivery">("status");

  async function forceOutcome(razorpayOrderId: string, outcome: "success" | "failure") {
    const res = await fetch("/api/sandbox/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpayOrderId, outcome }),
    });
    if (res.ok) toast.success(`Order forced to ${outcome}`);
    else toast.error("Failed to simulate outcome");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 rounded bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
        SANDBOX CONSOLE — no real money, messages, or deliveries. Dev-only, hidden in APP_MODE=live.
      </div>
      <h1 className="font-heading text-2xl">Sandbox Console</h1>

      <div className="mt-4 flex gap-2">
        {(["status", "notifications", "payments", "delivery"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm ${tab === t ? "bg-black text-white" : "bg-[var(--color-muted)]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "status" && (
        <div className="mt-6 grid gap-4">
          <h2 className="font-heading text-lg">Pending Payment Orders — force outcome</h2>
          {pendingOrders.map((o) => (
            <Card key={o.orderNumber}>
              <CardContent className="flex items-center justify-between">
                <span>{o.orderNumber} — {paiseToRupeeDisplay(o.totalPaise)}</span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!o.razorpayOrderId} onClick={() => forceOutcome(o.razorpayOrderId!, "success")}>
                    Force Success
                  </Button>
                  <Button size="sm" variant="danger" disabled={!o.razorpayOrderId} onClick={() => forceOutcome(o.razorpayOrderId!, "failure")}>
                    Force Failure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingOrders.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">No pending orders.</p>}
        </div>
      )}

      {tab === "notifications" && (
        <div className="mt-6 flex flex-col gap-3">
          {outbox.map((n) => (
            <Card key={n.id}>
              <CardContent>
                <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
                  <span>{n.channel} · {n.templateKey} · to {n.to}</span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                {n.subject && <p className="mt-1 font-medium">{n.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
              </CardContent>
            </Card>
          ))}
          {outbox.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">No notifications yet.</p>}
        </div>
      )}

      {tab === "payments" && (
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {paymentEvents.map((e) => (
            <div key={e.id} className="rounded border border-[var(--color-border)] p-3">
              <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
                <span>{e.eventType} · ref {e.refId}</span>
                <span>{new Date(e.createdAt).toLocaleString()}</span>
              </div>
              <pre className="mt-1 overflow-x-auto text-xs">{JSON.stringify(e.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      {tab === "delivery" && (
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {deliveryEvents.map((e) => (
            <div key={e.id} className="rounded border border-[var(--color-border)] p-3">
              <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
                <span>{e.eventType} · ref {e.refId}</span>
                <span>{new Date(e.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
