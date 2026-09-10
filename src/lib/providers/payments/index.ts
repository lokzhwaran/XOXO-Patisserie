import { getAppMode } from "@/lib/app-mode";
import { sandboxPaymentProvider } from "./sandbox";
import { liveRazorpayProvider } from "./live";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const mode = getAppMode();
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  if (mode === "live" && razorpayConfigured) return liveRazorpayProvider;
  return sandboxPaymentProvider;
}

export * from "./types";
