import crypto from "crypto";

/** Shared HMAC helpers used identically by both the live Razorpay provider and the sandbox
 *  simulator, so the verification code path is provably the same in both modes. */
export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPaymentSignatureWith(secret: string, orderId: string, paymentId: string, signature: string): boolean {
  if (!secret) return false;
  const expected = hmacSha256Hex(secret, `${orderId}|${paymentId}`);
  return timingSafeEqualHex(expected, signature);
}

export function verifyWebhookSignatureWith(secret: string, rawBody: string, signature: string): boolean {
  if (!secret) return false;
  const expected = hmacSha256Hex(secret, rawBody);
  return timingSafeEqualHex(expected, signature);
}
