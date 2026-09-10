"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppFloatButton({ whatsappNumber }: { whatsappNumber: string }) {
  const digits = whatsappNumber.replace(/\D/g, "");
  const message = encodeURIComponent("Hi! I have a question about ordering from XOXO Patisserie.");
  return (
    <a
      href={`https://wa.me/${digits}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
