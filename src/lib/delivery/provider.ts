export interface DeliveryQuote {
  farePaise: number;
  etaMinutes: number;
}

export interface DeliveryBookingResult {
  externalOrderId: string;
  trackingUrl?: string;
  status: string;
}

export interface DeliveryAddress {
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  area?: string | null;
  city: string;
  state: string;
  pincode: string;
}

/**
 * Common interface every delivery integration must implement. Keeping this abstraction
 * means we can add real courier APIs later without touching order/admin code.
 */
export interface DeliveryProvider {
  readonly name: "PORTER" | "MANUAL" | "SELF";
  isConfigured(): boolean;
  getQuote(pickup: DeliveryAddress, drop: DeliveryAddress, weightGrams: number): Promise<DeliveryQuote | null>;
  createBooking(params: {
    orderId: string;
    pickup: DeliveryAddress;
    drop: DeliveryAddress;
    weightGrams: number;
  }): Promise<DeliveryBookingResult>;
  cancelBooking(externalOrderId: string): Promise<void>;
  getStatus(externalOrderId: string): Promise<string>;
  handleWebhook(payload: unknown): Promise<void>;
}
