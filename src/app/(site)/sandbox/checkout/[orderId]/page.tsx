"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paiseToRupeeDisplay } from "@/lib/money";

type Outcome = "success" | "failure" | "pending" | "abandon";

export default function SandboxCheckoutPage() {
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState<Outcome | null>(null);

  const orderNumber = search.get("orderNumber") ?? "";
  const amount = Number(search.get("amount") ?? 0);

  async function choose(outcome: Outcome) {
    setLoading(outcome);
    const res = await fetch("/api/sandbox/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpayOrderId: params.orderId, outcome }),
    });
    const data = await res.json();
    setLoading(null);
    if (outcome === "success" && res.ok) {
      router.push(`/checkout/success/${orderNumber}`);
    } else if (outcome === "failure") {
      router.push(`/checkout/payment/${orderNumber}?failed=1`);
    } else if (outcome === "abandon") {
      router.push(`/checkout/payment/${orderNumber}`);
    } else {
      alert(data.message ?? "Payment pending");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md">
        <CardContent>
          <div className="mb-4 rounded bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800">
            SANDBOX CHECKOUT — simulates Razorpay Standard Checkout. No real money moves.
          </div>
          <h1 className="font-heading text-xl">Pay {paiseToRupeeDisplay(amount)}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Order {orderNumber}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button disabled={!!loading} onClick={() => choose("success")}>
              {loading === "success" ? "Processing..." : "Simulate Success (UPI)"}
            </Button>
            <Button variant="outline" disabled={!!loading} onClick={() => choose("pending")}>
              Simulate UPI Pending
            </Button>
            <Button variant="danger" disabled={!!loading} onClick={() => choose("failure")}>
              Simulate Failure
            </Button>
            <Button variant="ghost" disabled={!!loading} onClick={() => choose("abandon")}>
              Abandon Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
