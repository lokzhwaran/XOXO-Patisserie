import { describe, expect, it, beforeAll } from "vitest";
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  getAvailability,
  reserveCapacity,
  releaseReservedCapacity,
  releaseSoldCapacity,
  convertReservedToSold,
  CapacityExceededError,
} from "@/lib/capacity";
import { createOrder } from "@/server/actions/create-order";
import { confirmOrderPaid } from "@/server/actions/confirm-payment";
import { expireStalePendingOrders } from "@/lib/order-expiry";

/**
 * Guards the invariants that protect real money and real baking capacity: a day can never be
 * oversold, a payment can never be counted twice, and a webhook replay can never double-apply.
 */

const FUTURE = new Date("2031-03-12T00:00:00.000Z");

async function resetCapacity(productId: string, max: number, date = FUTURE) {
  await prisma.dailyCapacity.deleteMany({ where: { productId, date } });
  await prisma.dailyCapacity.create({
    data: { productId, date, maxQuantity: max, reservedQuantity: 0, soldQuantity: 0 },
  });
}

async function cleanupOrder(orderId: string) {
  await prisma.orderStatusEvent.deleteMany({ where: { orderId } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.payment.deleteMany({ where: { orderId } });
  await prisma.delivery.deleteMany({ where: { orderId } });
  await prisma.adminAlert.deleteMany({ where: { relatedOrderId: orderId } });
  await prisma.notificationOutbox.deleteMany({ where: { relatedOrderId: orderId } });
  await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
}

describe("Capacity integrity", () => {
  let productId: string;

  beforeAll(async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { isActive: true } });
    productId = product.id;
  });

  it("never lets reserved capacity go negative when releasing a reservation that was never held", async () => {
    await resetCapacity(productId, 10);

    await releaseReservedCapacity([{ productId, quantity: 3 }], FUTURE);

    const availability = await getAvailability(productId, FUTURE);
    expect(availability.reservedQuantity).toBe(0);
    // A negative counter would inflate `available` past maxQuantity and cause overselling.
    expect(availability.available).toBeLessThanOrEqual(availability.maxQuantity);
  });

  it("never lets sold capacity go negative when refunding more than was sold", async () => {
    await resetCapacity(productId, 10);

    await releaseSoldCapacity([{ productId, quantity: 5 }], FUTURE);

    const availability = await getAvailability(productId, FUTURE);
    expect(availability.soldQuantity).toBe(0);
    expect(availability.available).toBeLessThanOrEqual(availability.maxQuantity);
  });

  it("keeps counters consistent when payment confirmation converts an unreserved order", async () => {
    await resetCapacity(productId, 10);

    await convertReservedToSold([{ productId, quantity: 2 }], FUTURE);

    const availability = await getAvailability(productId, FUTURE);
    expect(availability.reservedQuantity).toBe(0);
    expect(availability.soldQuantity).toBe(2);
    expect(availability.available).toBe(8);
  });

  it("refuses to reserve beyond the daily maximum", async () => {
    await resetCapacity(productId, 4);

    await expect(
      reserveCapacity([{ productId, productName: "Test", quantity: 5 }], FUTURE)
    ).rejects.toBeInstanceOf(CapacityExceededError);

    const availability = await getAvailability(productId, FUTURE);
    expect(availability.reservedQuantity).toBe(0);
  });

  it("serializes concurrent reservations for the last unit so the day is never oversold", async () => {
    await resetCapacity(productId, 1);

    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        reserveCapacity([{ productId, productName: "Test", quantity: 1 }], FUTURE)
      )
    );

    const succeeded = attempts.filter((a) => a.status === "fulfilled").length;
    expect(succeeded).toBe(1);

    const availability = await getAvailability(productId, FUTURE);
    expect(availability.reservedQuantity).toBe(1);
    expect(availability.available).toBe(0);
  });
});

describe("Order lifecycle and payment idempotency", () => {
  it("confirms payment exactly once even when the client callback and webhook both fire", async () => {
    const product = await prisma.product.findFirstOrThrow({
      where: { isActive: true, sellingPricePaise: { gte: 15000 } },
    });
    const dateStr = format(addDays(new Date(), 5), "yyyy-MM-dd");
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    await resetCapacity(product.id, 20, date);
    await prisma.siteSettings.updateMany({ data: { ordersEnabled: true } });

    const created = await createOrder({
      details: {
        fullName: "Idempotency Test",
        phone: "9876500011",
        fulfilmentType: "PICKUP",
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: dateStr,
        requestedTimeSlot: "13:00-16:00",
        saveDetails: false,
        agreeToTerms: true,
      },
      items: [{ productId: product.id, variantId: null, quantity: 3 }],
    });
    expect(created.success).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: created.orderNumber! } });

    // Capacity is held, not yet sold.
    const reserved = await getAvailability(product.id, date);
    expect(reserved.reservedQuantity).toBe(3);
    expect(reserved.soldQuantity).toBe(0);

    const payload = {
      orderId: order.id,
      razorpayOrderId: `order_test_${order.id}`,
      razorpayPaymentId: `pay_test_${order.id}`,
      method: "upi",
    };

    const first = await confirmOrderPaid(payload);
    const second = await confirmOrderPaid(payload);

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);

    // The second call must not double-convert capacity.
    const afterPayment = await getAvailability(product.id, date);
    expect(afterPayment.soldQuantity).toBe(3);
    expect(afterPayment.reservedQuantity).toBe(0);

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("CONFIRMED");
    expect(paid.paymentStatus).toBe("PAID");

    // Exactly one CONFIRMED status event should have been recorded.
    const confirmedEvents = await prisma.orderStatusEvent.count({
      where: { orderId: order.id, toStatus: "CONFIRMED" },
    });
    expect(confirmedEvents).toBe(1);

    await cleanupOrder(order.id);
    await prisma.dailyCapacity.deleteMany({ where: { productId: product.id, date } });
  });

  it("expires an unpaid order and returns its capacity without corrupting counters", async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { isActive: true } });
    const dateStr = format(addDays(new Date(), 6), "yyyy-MM-dd");
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    await resetCapacity(product.id, 20, date);
    await prisma.siteSettings.updateMany({ data: { ordersEnabled: true } });

    const created = await createOrder({
      details: {
        fullName: "Expiry Test",
        phone: "9876500022",
        fulfilmentType: "PICKUP",
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: dateStr,
        requestedTimeSlot: "13:00-16:00",
        saveDetails: false,
        agreeToTerms: true,
      },
      items: [{ productId: product.id, variantId: null, quantity: 2 }],
    });
    expect(created.success).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: created.orderNumber! } });
    expect((await getAvailability(product.id, date)).reservedQuantity).toBe(2);

    // Force the reservation window to have lapsed, then run the sweep.
    await prisma.order.update({
      where: { id: order.id },
      data: { reservationExpiresAt: new Date(Date.now() - 60_000) },
    });
    await expireStalePendingOrders();

    const expired = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(expired.status).toBe("PAYMENT_FAILED");

    const afterExpiry = await getAvailability(product.id, date);
    expect(afterExpiry.reservedQuantity).toBe(0);
    expect(afterExpiry.available).toBeLessThanOrEqual(afterExpiry.maxQuantity);

    // A second sweep must be a no-op rather than driving the counter negative.
    await expireStalePendingOrders();
    const afterSecondSweep = await getAvailability(product.id, date);
    expect(afterSecondSweep.reservedQuantity).toBe(0);
    expect(afterSecondSweep.available).toBeLessThanOrEqual(afterSecondSweep.maxQuantity);

    await cleanupOrder(order.id);
    await prisma.dailyCapacity.deleteMany({ where: { productId: product.id, date } });
  });

  it("rejects orders below the configured minimum value", async () => {
    const settings = await prisma.siteSettings.findFirstOrThrow();
    const cheapest = await prisma.product.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { sellingPricePaise: "asc" },
    });
    const dateStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

    const result = await createOrder({
      details: {
        fullName: "Minimum Test",
        phone: "9876500033",
        fulfilmentType: "PICKUP",
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: dateStr,
        requestedTimeSlot: "13:00-16:00",
        saveDetails: false,
        agreeToTerms: true,
      },
      items: [{ productId: cheapest.id, variantId: null, quantity: 1 }],
    });

    if (cheapest.sellingPricePaise < settings.minOrderValuePaise) {
      expect(result.success).toBe(false);
    } else {
      // Pricing makes even a single unit clear the minimum — clean up the created order.
      const order = await prisma.order.findUnique({ where: { orderNumber: result.orderNumber! } });
      if (order) await cleanupOrder(order.id);
    }
  });
});

describe("Webhook replay protection", () => {
  it("records a webhook event id once so a replayed delivery is ignored", async () => {
    const eventId = `evt_test_${Date.now()}`;
    await prisma.webhookEvent.deleteMany({ where: { id: eventId } });

    await prisma.webhookEvent.create({
      data: { id: eventId, provider: "razorpay", eventType: "payment.captured" },
    });

    // The route's guard is a unique-constraint insert; a replay must collide rather than reprocess.
    await expect(
      prisma.webhookEvent.create({
        data: { id: eventId, provider: "razorpay", eventType: "payment.captured" },
      })
    ).rejects.toMatchObject({ code: "P2002" });

    await prisma.webhookEvent.deleteMany({ where: { id: eventId } });
  });
});
