export interface CreateOrderParams {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface PaymentLinkParams {
  amountPaise: number;
  description: string;
  customerName: string;
  customerPhone: string;
  referenceId: string;
}

export interface PaymentLinkResult {
  id: string;
  shortUrl: string;
}

export interface PaymentProvider {
  readonly mode: "sandbox" | "live";
  createOrder(params: CreateOrderParams): Promise<CreatedOrder>;
  /** URL the client should be sent to for checkout. Sandbox: local mock page. Live: n/a (uses Razorpay Checkout.js). */
  getCheckoutUrl(order: CreatedOrder, orderNumber: string): string | null;
  verifyPaymentSignature(params: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  createPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResult>;
}
