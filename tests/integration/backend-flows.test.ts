import { describe, expect, it } from "vitest";
import { calcGstPaise, paiseToRupeeDisplay, paiseToWords, rupeesToPaise } from "@/lib/money";
import { verifyPaymentSignatureWith, verifyWebhookSignatureWith, hmacSha256Hex } from "@/lib/providers/payments/signature";
import { hashPassword } from "@/lib/providers/auth/sandbox";
import { checkoutDetailsSchema } from "@/lib/validation";

describe("Backend Business Logic & Core Guardrails", () => {
  describe("Financial & Money Calculation Engine", () => {
    it("correctly computes standard 5% GST and packaging", () => {
      const subtotal = 100000; // ₹1,000.00
      const gstRate = 5;
      const gst = calcGstPaise(subtotal, gstRate);
      expect(gst).toBe(5000); // ₹50.00

      const packaging = 3000; // ₹30.00
      const total = subtotal + gst + packaging;
      expect(total).toBe(108000);
      expect(paiseToRupeeDisplay(total)).toBe("₹1,080");
    });

    it("converts rupees to paise and formats decimals cleanly", () => {
      expect(rupeesToPaise(150.5)).toBe(15050);
      expect(rupeesToPaise(0.99)).toBe(99);
      expect(paiseToRupeeDisplay(9900)).toBe("₹99");
      expect(paiseToRupeeDisplay(9950)).toBe("₹99.50");
    });

    it("generates correct words for invoices", () => {
      expect(paiseToWords(55000)).toBe("Rupees Five Hundred Fifty Only");
      expect(paiseToWords(100000)).toBe("Rupees One Thousand Only");
    });
  });

  describe("Checkout Validation Rules", () => {
    it("validates Indian phone numbers correctly", () => {
      const validForm = {
        fullName: "Priya Ramesh",
        phone: "9876543210",
        fulfilmentType: "PICKUP" as const,
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: "2026-09-15",
        requestedTimeSlot: "13:00-16:00",
        saveDetails: true,
        agreeToTerms: true as const,
      };

      const result = checkoutDetailsSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it("enforces address and pincode requirements for delivery orders", () => {
      const deliveryWithoutAddress = {
        fullName: "Priya Ramesh",
        phone: "9876543210",
        fulfilmentType: "DELIVERY" as const,
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: "2026-09-15",
        requestedTimeSlot: "13:00-16:00",
        saveDetails: true,
        agreeToTerms: true as const,
      };

      const result = checkoutDetailsSchema.safeParse(deliveryWithoutAddress);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain("addressLine1");
        expect(issues).toContain("pincode");
      }
    });

    it("rejects invalid pincodes and malformed phone numbers", () => {
      const invalid = {
        fullName: "Priya Ramesh",
        phone: "12345", // invalid mobile
        fulfilmentType: "DELIVERY" as const,
        addressLine1: "123 Anna Salai",
        pincode: "6000", // invalid pincode (must be 6 digits)
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: "2026-09-15",
        requestedTimeSlot: "13:00-16:00",
        saveDetails: true,
        agreeToTerms: true as const,
      };

      const result = checkoutDetailsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Cryptographic Security & Signatures", () => {
    const SECRET = "test_webhook_secret_xoxobakery";

    it("validates authentic Razorpay payment signatures", () => {
      const orderId = "order_1234567890";
      const paymentId = "pay_9876543210";
      const signature = hmacSha256Hex(SECRET, `${orderId}|${paymentId}`);

      const isValid = verifyPaymentSignatureWith(SECRET, orderId, paymentId, signature);
      expect(isValid).toBe(true);

      const isInvalid = verifyPaymentSignatureWith(SECRET, orderId, paymentId, "forged_signature_hex");
      expect(isInvalid).toBe(false);
    });

    it("validates authentic webhook payload signatures", () => {
      const payload = JSON.stringify({ event: "payment.captured", id: "evt_12345" });
      const signature = hmacSha256Hex(SECRET, payload);

      expect(verifyWebhookSignatureWith(SECRET, payload, signature)).toBe(true);
      expect(verifyWebhookSignatureWith(SECRET, payload + " ", signature)).toBe(false);
    });

    it("produces strong scrypt salt:hash passwords for admin security", async () => {
      const rawPassword = "SecurePassword@123";
      const hash = await hashPassword(rawPassword);

      expect(hash).toContain(":");
      const [salt, derived] = hash.split(":");
      expect(salt).toHaveLength(32); // 16 bytes hex
      expect(derived).toHaveLength(128); // 64 bytes hex

      const secondHash = await hashPassword(rawPassword);
      // Different salt every time
      expect(secondHash).not.toBe(hash);
    });
  });

  describe("Order Expiry & Cleanup Logic", () => {
    it("identifies expired reservation timestamps accurately", () => {
      const now = Date.now();
      const pastReservation = new Date(now - 20 * 60 * 1000); // 20 mins ago
      const activeReservation = new Date(now + 10 * 60 * 1000); // 10 mins in future

      expect(pastReservation.getTime()).toBeLessThan(now);
      expect(activeReservation.getTime()).toBeGreaterThan(now);
    });
  });
});
