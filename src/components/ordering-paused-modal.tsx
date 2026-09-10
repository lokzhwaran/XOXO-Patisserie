"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function OrderingPausedModal({
  message,
  nextAvailableMessage,
  whatsappNumber,
  onClose,
}: {
  message: string;
  nextAvailableMessage: string | null;
  whatsappNumber: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-xl">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4">
          <X className="h-5 w-5" />
        </button>
        <h3 className="font-heading text-xl">We&apos;re not taking orders right now</h3>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{message}</p>
        {nextAvailableMessage && (
          <p className="mt-2 text-sm font-medium">{nextAvailableMessage}</p>
        )}
        {submitted ? (
          <p className="mt-4 text-sm text-[var(--color-success)]">
            Thanks! We&apos;ll text you the moment we reopen.
          </p>
        ) : (
          <div className="mt-4 flex gap-2">
            <Input
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button
              onClick={() => {
                if (phone.length < 10) {
                  toast.error("Enter a valid phone number");
                  return;
                }
                setSubmitted(true);
              }}
            >
              Notify me
            </Button>
          </div>
        )}
        <a
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block text-center text-sm font-medium text-[var(--color-primary)] underline"
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
