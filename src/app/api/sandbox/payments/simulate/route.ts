import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { signSandboxPayment, signSandboxWebhook } from "@/lib/providers/payments/sandbox";
import { isSandboxMode } from "@/lib/app-mode";

/**
 * The sandbox mock-checkout page posts here to simulate a Razorpay outcome. On "success" this
 * self-fires a correctly signed webhook to /api/webhooks/razorpay — the exact same endpoint and
 * signature-verification code path used in live mode — so the webhook is genuinely exercised.
 */
export async function POST(request: Request) {
  if (!isSandboxMode()) {
    return NextResponse.json({ error: "Sandbox endpoints are disabled in live mode" }, { status: 403 });
  }

  const { razorpayOrderId, outcome } = await request.json();
  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (outcome === "pending") {
    return NextResponse.json({ message: "UPI payment is pending confirmation from your bank." });
  }
  if (outcome === "abandon") {
    return NextResponse.json({ message: "Checkout abandoned — order stays PENDING_PAYMENT." });
  }

  const paymentId = `pay_sandbox_${nanoid(14)}`;
  const eventType = outcome === "success" ? "payment.captured" : "payment.failed";

  if (outcome === "success") {
    const signature = signSandboxPayment(razorpayOrderId, paymentId);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { razorpayPaymentId: paymentId, razorpaySignature: signature, method: "upi" },
    });
  }

  const webhookBody = JSON.stringify({
    id: `evt_sandbox_${nanoid(14)}`,
    event: eventType,
    payload: {
      payment: {
        entity: { id: paymentId, order_id: razorpayOrderId, method: "upi", status: outcome === "success" ? "captured" : "failed" },
      },
    },
  });
  const webhookSignature = signSandboxWebhook(webhookBody);

  const webhookRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/webhooks/razorpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": webhookSignature },
    body: webhookBody,
  });

  await prisma.sandboxEvent.create({
    data: { domain: "PAYMENT", eventType, refId: payment.orderId, payload: { paymentId, webhookStatus: webhookRes.status } },
  });

  return NextResponse.json({ success: webhookRes.ok });
}
