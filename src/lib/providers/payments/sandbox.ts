import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import type { CreateOrderParams, CreatedOrder, PaymentLinkParams, PaymentLinkResult, PaymentProvider } from "./types";
import { verifyPaymentSignatureWith, verifyWebhookSignatureWith, hmacSha256Hex } from "./signature";

// Fixed, documented sandbox secrets — never used for anything but the local simulator.
const SANDBOX_KEY_SECRET = "sandbox_secret_key";
const SANDBOX_WEBHOOK_SECRET = "sandbox_webhook_secret";

export const sandboxPaymentProvider: PaymentProvider = {
  mode: "sandbox",

  async createOrder(params: CreateOrderParams): Promise<CreatedOrder> {
    const id = `order_sandbox_${nanoid(14)}`;
    await prisma.sandboxEvent.create({
      data: { domain: "PAYMENT", eventType: "ORDER_CREATED", refId: id, payload: { ...params } },
    });
    return { id, amount: params.amountPaise, currency: "INR" };
  },

  getCheckoutUrl(order, orderNumber) {
    return `/sandbox/checkout/${order.id}?orderNumber=${orderNumber}&amount=${order.amount}`;
  },

  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // Identical HMAC verification code path as the live provider — only the secret differs.
    return verifyPaymentSignatureWith(SANDBOX_KEY_SECRET, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  },

  verifyWebhookSignature(rawBody, signature) {
    return verifyWebhookSignatureWith(SANDBOX_WEBHOOK_SECRET, rawBody, signature);
  },

  async createPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResult> {
    const id = `plink_sandbox_${nanoid(14)}`;
    await prisma.sandboxEvent.create({
      data: { domain: "PAYMENT", eventType: "PAYMENT_LINK_CREATED", refId: id, payload: { ...params } },
    });
    return { id, shortUrl: `/sandbox/pay/${id}?ref=${params.referenceId}&amount=${params.amountPaise}` };
  },
};

/** Used by the mock checkout page to sign a client callback exactly like Razorpay would. */
export function signSandboxPayment(orderId: string, paymentId: string): string {
  return hmacSha256Hex(SANDBOX_KEY_SECRET, `${orderId}|${paymentId}`);
}

/** Used by the mock checkout page to self-fire a correctly signed webhook event. */
export function signSandboxWebhook(rawBody: string): string {
  return hmacSha256Hex(SANDBOX_WEBHOOK_SECRET, rawBody);
}
