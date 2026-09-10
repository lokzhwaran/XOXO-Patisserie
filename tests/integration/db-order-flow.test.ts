import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/server/actions/create-order";
import { confirmOrderPaid } from "@/server/actions/confirm-payment";
import { getAvailability } from "@/lib/capacity";
import { addDays, format } from "date-fns";

describe("Database & Order Lifecycle Integration", () => {
  it("executes a full end-to-end order reservation and payment confirmation flow against the database", async () => {
    // 1. Fetch an active product
    const product = await prisma.product.findFirst({
      where: { isActive: true },
    });
    expect(product).toBeDefined();
    if (!product) return;

    const dateStr = format(addDays(new Date(), 3), "yyyy-MM-dd");
    const testDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Reset test date capacity to clean state for repeatability
    await prisma.dailyCapacity.deleteMany({
      where: { date: testDate },
    });

    // 2. Check initial availability
    const initialAvail = await getAvailability(product.id, testDate);
    expect(initialAvail.maxQuantity).toBeGreaterThan(0);

    // 3. Ensure orders are enabled in SiteSettings for the test
    await prisma.siteSettings.updateMany({
      data: { ordersEnabled: true },
    });

    // 3. Create a new order with 2 units of this product (total = 2 * 15000 + gst + packaging = 34500 > 30000 min)
    const orderResult = await createOrder({
      details: {
        fullName: "Automated Test User",
        phone: "9876543210",
        fulfilmentType: "PICKUP",
        city: "Chennai",
        state: "Tamil Nadu",
        requestedDate: dateStr,
        requestedTimeSlot: "13:00-16:00",
        saveDetails: true,
        agreeToTerms: true,
      },
      items: [
        {
          productId: product.id,
          variantId: null,
          quantity: 2,
        },
      ],
    });

    if (!orderResult.success) {
      console.error("Order creation failed with error:", orderResult.error);
    }
    expect(orderResult.success).toBe(true);
    expect(orderResult.orderNumber).toBeDefined();
    const orderNumber = orderResult.orderNumber!;

    // 4. Verify reservation was recorded in DailyCapacity
    const reservedAvail = await getAvailability(product.id, testDate);
    expect(reservedAvail.reservedQuantity).toBeGreaterThanOrEqual(2);

    // 5. Query order from DB
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, customer: true },
    });
    expect(order).toBeDefined();
    expect(order!.status).toBe("PENDING_PAYMENT");
    expect(order!.paymentStatus).toBe("PENDING");

    // 6. Confirm payment
    const confirmResult = await confirmOrderPaid({
      orderId: order!.id,
      razorpayOrderId: `order_test_${Date.now()}`,
      razorpayPaymentId: `pay_test_${Date.now()}`,
      razorpaySignature: "test_sig",
      method: "upi",
    });

    expect(confirmResult.alreadyProcessed).toBe(false);

    // 7. Verify order status is now CONFIRMED and PAID
    const paidOrder = await prisma.order.findUnique({
      where: { id: order!.id },
    });
    expect(paidOrder!.status).toBe("CONFIRMED");
    expect(paidOrder!.paymentStatus).toBe("PAID");

    // 8. Verify capacity was converted from reserved to sold
    const soldAvail = await getAvailability(product.id, testDate);
    expect(soldAvail.soldQuantity).toBeGreaterThanOrEqual(2);

    // Clean up test order and test capacity
    await prisma.orderStatusEvent.deleteMany({ where: { orderId: order!.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order!.id } });
    await prisma.payment.deleteMany({ where: { orderId: order!.id } });
    await prisma.order.delete({ where: { id: order!.id } });
    await prisma.dailyCapacity.deleteMany({ where: { date: testDate } });
  });
});
