import type { DeliveryBookingResult, DeliveryProvider, DeliveryQuote } from "./provider";

/** For orders the owner delivers personally. Fare and status are recorded manually. */
export class SelfProvider implements DeliveryProvider {
  readonly name = "SELF" as const;

  isConfigured(): boolean {
    return true;
  }

  async getQuote(): Promise<DeliveryQuote | null> {
    return null;
  }

  async createBooking(): Promise<DeliveryBookingResult> {
    return { externalOrderId: `SELF-${Date.now()}`, status: "BOOKED" };
  }

  async cancelBooking(): Promise<void> {}

  async getStatus(): Promise<string> {
    return "SELF";
  }

  async handleWebhook(): Promise<void> {}
}
