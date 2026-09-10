import { PorterProvider } from "./porter";
import { ManualProvider } from "./manual";
import { SelfProvider } from "./self";
import type { DeliveryProvider } from "./provider";

const porter = new PorterProvider();
const manual = new ManualProvider();
const self = new SelfProvider();

export function getDeliveryProvider(preferred: "PORTER" | "MANUAL" | "SELF"): DeliveryProvider {
  if (preferred === "PORTER" && porter.isConfigured()) return porter;
  if (preferred === "SELF") return self;
  return manual; // graceful fallback — manual always works
}

export { porter, manual, self };
export * from "./provider";
export { porterAppDeepLink, rapidoAppDeepLink, formatAddress } from "./manual";
