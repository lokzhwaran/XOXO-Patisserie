import Razorpay from "razorpay";
import type { CreateOrderParams, CreatedOrder, PaymentLinkParams, PaymentLinkResult, PaymentProvider } from "./types";
import { verifyPaymentSignatureWith, verifyWebhookSignatureWith } from "./signature";

const keyId = process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

export const liveRazorpayProvider: PaymentProvider = {
  mode: "live",

  async createOrder(params: CreateOrderParams): Promise<CreatedOrder> {
    if (!razorpay) throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing).");
    const order = await razorpay.orders.create({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    });
    return { id: order.id, amount: Number(order.amount), currency: order.currency };
  },

  getCheckoutUrl() {
    return null; // live mode opens Razorpay's own Checkout.js modal client-side
  },

  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    return verifyPaymentSignatureWith(keySecret, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  },

  verifyWebhookSignature(rawBody, signature) {
    return verifyWebhookSignatureWith(webhookSecret, rawBody, signature);
  },

  async createPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResult> {
    if (!razorpay) throw new Error("Razorpay is not configured.");
    const link = await razorpay.paymentLink.create({
      amount: params.amountPaise,
      currency: "INR",
      description: params.description,
      customer: { name: params.customerName, contact: params.customerPhone },
      reference_id: params.referenceId,
      notify: { sms: true, email: false },
    });
    return { id: link.id, shortUrl: link.short_url ?? "" };
  },
};
