"use client";

import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paiseToRupeeDisplay } from "@/lib/money";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function PaymentPanel({ orderNumber, amountPaise }: { orderNumber: string; amountPaise: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  async function startPayment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/create/${orderNumber}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Unable to start payment");
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: "INR",
        name: "XOXO Patisserie",
        description: `Order ${orderNumber}`,
        // UPI is highlighted first; Razorpay's UPI-intent flow auto-opens GPay/PhonePe/Paytm on mobile.
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
              other: { name: "Other methods", instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }] },
            },
            sequence: ["block.upi", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            router.push(`/checkout/success/${orderNumber}`);
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#B5763A" },
      });
      razorpay.open();
    } catch {
      toast.error("Something went wrong starting payment");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} />
      <h2 className="font-heading text-lg sm:text-xl">Pay {paiseToRupeeDisplay(amountPaise)}</h2>
      <p className="mt-2 text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed">
        On mobile, UPI apps like Google Pay, PhonePe and Paytm open automatically. On desktop, scan the QR code or
        enter your UPI ID. Cards, netbanking and wallets are also supported.
      </p>
      <Button size="lg" className="mt-5 sm:mt-6 w-full shadow-md" disabled={loading || !scriptReady} onClick={startPayment}>
        {loading ? "Opening payment..." : "Pay Now"}
      </Button>
      <PayLaterViaLink orderNumber={orderNumber} />
    </div>
  );
}

function PayLaterViaLink({ orderNumber }: { orderNumber: string }) {
  const [phone, setPhone] = useState("");
  return (
    <div className="mt-5 sm:mt-6 border-t border-[var(--color-border)] pt-4">
      <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
        Prefer to pay later? We&apos;ll text a payment link for order {orderNumber} to your phone.
      </p>
      <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
        <Input placeholder="Your phone number" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1" />
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => {
            if (phone.length < 10) {
              toast.error("Please enter a valid phone number");
              return;
            }
            toast.success("A payment link will be sent to your phone shortly.");
          }}
        >
          Send link
        </Button>
      </div>
    </div>
  );
}
