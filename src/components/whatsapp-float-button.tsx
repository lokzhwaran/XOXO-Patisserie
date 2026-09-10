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
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  );
}
