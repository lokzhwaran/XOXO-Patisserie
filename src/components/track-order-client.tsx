"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paiseToRupeeDisplay } from "@/lib/money";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Order confirmed",
  IN_PROGRESS: "Being prepared",
  BAKED: "Freshly baked",
  PACKED: "Packed & ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  READY_FOR_PICKUP: "Ready for pickup",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PAYMENT_FAILED: "Payment failed",
};

interface TrackedOrder {
  orderNumber: string;
  status: string;
  totalPaise: number;
  requestedDate: string;
  requestedTimeSlot: string;
  deliveryChargePaise: number | null;
  deliveryChargeStatus: string;
  items: { nameSnapshot: string; quantity: number; lineTotalPaise: number }[];
  statusEvents: { toStatus: string; createdAt: string; note: string | null }[];
  delivery: { riderName: string | null; riderPhone: string | null; trackingUrl: string | null } | null;
}

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") ?? "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async () => {
    if (phone.length < 10 || orderNumber.length < 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setOrder(null);
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, [phone, orderNumber]);

  useEffect(() => {
    if (!order) return;
    const interval = setInterval(lookup, 30_000);
    return () => clearInterval(interval);
  }, [order, lookup]);

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="orderNumber">Order ID</Label>
            <Input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          </div>
          <Button className="sm:col-span-2" onClick={lookup} disabled={loading}>
            {loading ? "Searching..." : "Track Order"}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}

      {order && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="font-heading text-xl">Order {order.orderNumber}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Expected {format(new Date(order.requestedDate), "EEEE, d MMM")} · {order.requestedTimeSlot}
            </p>

            <ol className="mt-6 flex flex-col gap-4 border-l-2 border-[var(--color-border)] pl-4">
              {order.statusEvents.map((event, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[22px] flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-primary-foreground)]" />
                  </span>
                  <p className="font-medium">{STATUS_LABELS[event.toStatus] ?? event.toStatus}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {format(new Date(event.createdAt), "d MMM, h:mm a")}
                  </p>
                </li>
              ))}
            </ol>

            {order.delivery?.riderName && (
              <div className="mt-6 rounded-[var(--radius-base)] bg-[var(--color-muted)] p-4 text-sm">
                <p className="font-medium">Your rider: {order.delivery.riderName}</p>
                {order.delivery.riderPhone && <p>{order.delivery.riderPhone}</p>}
                {order.delivery.trackingUrl && (
                  <a href={order.delivery.trackingUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">
                    Live tracking
                  </a>
                )}
              </div>
            )}

            {order.deliveryChargeStatus === "PENDING" && order.deliveryChargePaise && (
              <div className="mt-6 rounded-[var(--radius-base)] border border-[var(--color-warning)] p-4">
                <p className="text-sm font-medium">
                  Delivery charge pending — {paiseToRupeeDisplay(order.deliveryChargePaise)}
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => toast.success("A payment link has been sent to your phone.")}
                >
                  Pay delivery charge
                </Button>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-sm">
              <p className="mb-2 font-medium">Items</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.nameSnapshot} × {item.quantity}</span>
                  <span>{paiseToRupeeDisplay(item.lineTotalPaise)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{paiseToRupeeDisplay(order.totalPaise)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 rounded-[var(--radius-base)] bg-[var(--color-muted)] p-5 text-center text-sm">
        <p className="font-medium">Lost your Order ID?</p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Message us on WhatsApp with your phone number and we&apos;ll find it for you.
        </p>
        <a
          href="https://wa.me/919999999999?text=Hi!%20I%20lost%20my%20order%20ID.%20My%20phone%20number%20is..."
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-medium text-[var(--color-primary)] underline"
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
