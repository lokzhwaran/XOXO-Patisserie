"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paiseToRupeeDisplay } from "@/lib/money";

export default function SandboxPaymentLinkPage() {
  const params = useParams<{ linkId: string }>();
  const search = useSearchParams();
  const [paid, setPaid] = useState(false);

  const amount = Number(search.get("amount") ?? 0);
  const ref = search.get("ref") ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-md">
        <CardContent>
          <div className="mb-4 rounded bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800">
            SANDBOX PAYMENT LINK ({params.linkId})
          </div>
          <h1 className="font-heading text-xl">Pay {paiseToRupeeDisplay(amount)}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Reference: {ref}</p>
          {paid ? (
            <p className="mt-6 text-center text-[var(--color-success)]">Payment simulated successfully.</p>
          ) : (
            <Button className="mt-6 w-full" onClick={() => setPaid(true)}>
              Simulate Payment
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
