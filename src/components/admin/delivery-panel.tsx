"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

interface DeliveryInfo {
  provider: string;
  riderName: string | null;
  riderPhone: string | null;
  trackingUrl: string | null;
  actualFarePaise: number | null;
}

export function DeliveryPanel({
  orderId,
  fulfilmentType,
  delivery,
  deliveryChargeStatus,
  deliveryChargePaise,
}: {
  orderId: string;
  fulfilmentType: string;
  delivery: DeliveryInfo | null;
  deliveryChargeStatus: string;
  deliveryChargePaise: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [riderName, setRiderName] = useState(delivery?.riderName ?? "");
  const [riderPhone, setRiderPhone] = useState(delivery?.riderPhone ?? "");
  const [fare, setFare] = useState(delivery?.actualFarePaise ? String(delivery.actualFarePaise / 100) : "");
  const [trackingUrl, setTrackingUrl] = useState(delivery?.trackingUrl ?? "");
  const [submitting, setSubmitting] = useState(false);

  if (fulfilmentType === "PICKUP") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <h2 className="font-heading text-lg">Fulfilment</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">This is a pickup order — no delivery needed.</p>
      </div>
    );
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "MANUAL",
          riderName,
          riderPhone,
          farePaise: Math.round(parseFloat(fare || "0") * 100),
          trackingUrl,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Delivery arranged — customer notified with payment link");
      setOpen(false);
    } catch {
      toast.error("Failed to save delivery details");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="font-heading text-lg">Delivery</h2>
      {delivery ? (
        <div className="mt-2 text-sm">
          <p>{delivery.riderName} · {delivery.riderPhone}</p>
          <p className="text-[var(--color-muted-foreground)]">
            Charge: {deliveryChargeStatus}
            {deliveryChargePaise ? ` — \u20b9${(deliveryChargePaise / 100).toFixed(0)}` : ""}
          </p>
        </div>
      ) : open ? (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <Label htmlFor="riderName">Rider name</Label>
            <Input id="riderName" value={riderName} onChange={(e) => setRiderName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="riderPhone">Rider phone</Label>
            <Input id="riderPhone" value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fare">Fare charged to customer (\u20b9)</Label>
            <Input id="fare" type="number" value={fare} onChange={(e) => setFare(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="trackingUrl">Tracking URL</Label>
            <Input id="trackingUrl" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
          </div>
          <Button disabled={submitting} onClick={submit}>
            Save & send payment link
          </Button>
        </div>
      ) : (
        <Button className="mt-3" onClick={() => setOpen(true)}>
          Arrange delivery
        </Button>
      )}
    </div>
  );
}
