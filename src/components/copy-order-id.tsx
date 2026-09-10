"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyOrderId({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(orderNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-[var(--color-muted)] px-6 py-3 font-heading text-2xl"
    >
      {orderNumber}
      {copied ? <Check className="h-5 w-5 text-[var(--color-success)]" /> : <Copy className="h-5 w-5" />}
    </button>
  );
}
