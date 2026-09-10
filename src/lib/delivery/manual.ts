import type { DeliveryAddress, DeliveryBookingResult, DeliveryProvider, DeliveryQuote } from "./provider";

/**
 * Default, fully-functional day-one delivery path. The admin books the ride manually in the
 * Porter/Rapido app and records the details here; nothing depends on a third-party API key.
 */
export class ManualProvider implements DeliveryProvider {
  readonly name = "MANUAL" as const;

  isConfigured(): boolean {
    return true;
  }

  async getQuote(): Promise<DeliveryQuote | null> {
    return null; // fare is entered manually by the admin after booking in the third-party app
  }

  async createBooking(): Promise<DeliveryBookingResult> {
    // The admin's "Arrange delivery" modal writes the Delivery row directly (see
    // src/app/admin/orders/[orderId]/actions.ts) rather than calling this method — manual
    // bookings never touch an external API.
    return { externalOrderId: `MANUAL-${Date.now()}`, status: "BOOKED" };
  }

  async cancelBooking(): Promise<void> {
    // No external system to cancel.
  }

  async getStatus(): Promise<string> {
    return "MANUAL";
  }

  async handleWebhook(): Promise<void> {
    // Manual provider has no webhooks.
  }
}

/** Deep links that prefill the pickup/drop addresses in third-party rider apps where supported. */
export function porterAppDeepLink(pickup: DeliveryAddress, drop: DeliveryAddress): string {
  const pickupStr = encodeURIComponent(formatAddress(pickup));
  const dropStr = encodeURIComponent(formatAddress(drop));
  return `https://porter.in/?pickup=${pickupStr}&drop=${dropStr}`;
}

export function rapidoAppDeepLink(pickup: DeliveryAddress, drop: DeliveryAddress): string {
  const pickupStr = encodeURIComponent(formatAddress(pickup));
  const dropStr = encodeURIComponent(formatAddress(drop));
  return `https://rapido.bike/?pickup=${pickupStr}&drop=${dropStr}`;
}

export function formatAddress(addr: DeliveryAddress): string {
  return [addr.line1, addr.line2, addr.landmark, addr.area, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");
}
