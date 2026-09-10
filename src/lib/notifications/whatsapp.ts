import { prisma } from "../prisma";
import { getAppMode } from "@/lib/app-mode";

export type NotificationChannel = "WHATSAPP" | "EMAIL";

export interface WhatsAppSendResult {
  success: boolean;
  error?: string;
}

const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN ?? "";
const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";

export const whatsappEnabled = Boolean(whatsappToken && whatsappPhoneId);

/**
 * Sends a WhatsApp message. In live mode with credentials configured, calls the real Cloud API.
 * Otherwise (sandbox mode, or live mode with no credentials yet) writes a fully-rendered message
 * to NotificationOutbox — reviewable in the Sandbox Console — so nothing silently fails to send.
 */
export async function sendWhatsAppMessage(params: {
  to: string; // E.164, e.g. +91XXXXXXXXXX
  body: string;
  templateKey?: string;
  relatedOrderId?: string;
}): Promise<WhatsAppSendResult> {
  const useLive = getAppMode() === "live" && whatsappEnabled;

  if (!useLive) {
    await prisma.notificationOutbox.create({
      data: {
        channel: "WHATSAPP",
        templateKey: params.templateKey ?? "custom",
        to: params.to,
        body: params.body,
        variables: {},
        relatedOrderId: params.relatedOrderId,
      },
    });
    return { success: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to.replace("+", ""),
        type: "text",
        text: { body: params.body },
      }),
    });
    const ok = res.ok;
    await logNotification({ ...params, channel: "WHATSAPP", status: ok ? "SENT" : "FAILED" });
    return { success: ok, error: ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    await logNotification({ ...params, channel: "WHATSAPP", status: "FAILED" });
    return { success: false, error: (err as Error).message };
  }
}

export function whatsappDeepLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

async function logNotification(params: {
  to: string;
  body: string;
  channel: NotificationChannel;
  status: string;
  relatedOrderId?: string;
}) {
  await prisma.adminAlert
    .create({
      data: {
        type: `NOTIFICATION_${params.channel}`,
        severity: params.status === "FAILED" ? "WARNING" : "INFO",
        title: `${params.channel} to ${params.to}: ${params.status}`,
        body: params.body.slice(0, 500),
        relatedOrderId: params.relatedOrderId,
      },
    })
    .catch(() => undefined);
}

/** Templates support {{name}}, {{orderId}}, {{status}}, {{trackingUrl}} placeholders. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export const DEFAULT_WHATSAPP_TEMPLATES: Record<string, string> = {
  ORDER_CONFIRMED:
    "Hi {{name}}! 🎉 Your order {{orderId}} is confirmed. Track it here: {{trackingUrl}}",
  STATUS_CHANGE: "Hi {{name}}, your order {{orderId}} is now: {{status}}. Track: {{trackingUrl}}",
  DELIVERY_ARRANGED:
    "Hi {{name}}, your order {{orderId}} is on its way! Rider: {{riderName}} ({{riderPhone}}). Please pay the delivery charge here: {{paymentLink}}",
  DELIVERY_CHARGE_REMINDER:
    "Hi {{name}}, a small reminder to complete the delivery charge payment for order {{orderId}}: {{paymentLink}}",
  ORDER_DELIVERED:
    "Hi {{name}}, we hope you loved your order {{orderId}}! Thank you for choosing XOXO Patisserie. 💛",
};
