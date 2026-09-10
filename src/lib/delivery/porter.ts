import type { DeliveryAddress, DeliveryBookingResult, DeliveryProvider, DeliveryQuote } from "./provider";

/**
 * Porter delivery integration. Porter (porter.in) offers intra-city delivery across Indian
 * cities including Chennai, but API access is only granted to business/enterprise accounts on
 * request — there is no instant self-serve key. This adapter is driven entirely by env vars and
 * self-disables gracefully when unconfigured, so the order flow never breaks.
 *
 * NOTE: request/response shapes here are best-effort based on Porter's publicly documented
 * partner API and MUST be corrected against the real docs once PORTER_API_KEY is issued.
 */
export class PorterProvider implements DeliveryProvider {
  readonly name = "PORTER" as const;

  private get apiKey() {
    return process.env.PORTER_API_KEY ?? "";
  }
  private get baseUrl() {
    return process.env.PORTER_BASE_URL ?? "https://pfe-apigw-prod.porter.in";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async getQuote(
    pickup: DeliveryAddress,
    drop: DeliveryAddress,
    weightGrams: number
  ): Promise<DeliveryQuote | null> {
    if (!this.isConfigured()) return null;
    try {
      const res = await fetch(`${this.baseUrl}/v1/get_quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
        body: JSON.stringify({ pickup, drop, weightGrams }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { farePaise: data.fare_paise ?? data.farePaise, etaMinutes: data.eta_minutes ?? 30 };
    } catch {
      return null; // self-disable on any error — never break checkout/admin flow
    }
  }

  async createBooking(params: {
    orderId: string;
    pickup: DeliveryAddress;
    drop: DeliveryAddress;
    weightGrams: number;
  }): Promise<DeliveryBookingResult> {
    if (!this.isConfigured()) {
      throw new Error("Porter is not configured");
    }
    const res = await fetch(`${this.baseUrl}/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
      body: JSON.stringify({
        reference_id: params.orderId,
        pickup: params.pickup,
        drop: params.drop,
        weight_grams: params.weightGrams,
      }),
    });
    if (!res.ok) throw new Error(`Porter booking failed: ${res.status}`);
    const data = await res.json();
    return {
      externalOrderId: data.order_id,
      trackingUrl: data.tracking_url,
      status: data.status ?? "BOOKED",
    };
  }

  async cancelBooking(externalOrderId: string): Promise<void> {
    if (!this.isConfigured()) return;
    await fetch(`${this.baseUrl}/v1/orders/${externalOrderId}/cancel`, {
      method: "POST",
      headers: { "X-API-Key": this.apiKey },
    }).catch(() => undefined);
  }

  async getStatus(externalOrderId: string): Promise<string> {
    if (!this.isConfigured()) return "UNKNOWN";
    try {
      const res = await fetch(`${this.baseUrl}/v1/orders/${externalOrderId}`, {
        headers: { "X-API-Key": this.apiKey },
      });
      if (!res.ok) return "UNKNOWN";
      const data = await res.json();
      return data.status ?? "UNKNOWN";
    } catch {
      return "UNKNOWN";
    }
  }

  async handleWebhook(): Promise<void> {
    // Wired up once Porter issues webhook signing docs; no-op until then.
  }
}
