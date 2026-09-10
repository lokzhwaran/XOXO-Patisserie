import { prisma } from "@/lib/prisma";
import { porter, type DeliveryAddress } from "@/lib/delivery";
import { getPaymentProvider } from "@/lib/providers/payments";
import { sendWhatsAppMessage, renderTemplate, DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/notifications/whatsapp";

/**
 * Attempts to auto-book a Porter pickup when a DELIVERY order becomes ready (moves to PACKED).
 * Self-disables silently if Porter isn't configured or the admin hasn't opted into auto-booking
 * (Settings > Delivery) — the admin then uses the manual "Arrange delivery" panel instead. Never
 * throws and never blocks the status-change request that triggered it.
 */
export async function tryAutoBookPorterDelivery(orderId: string): Promise<boolean> {
  if (!porter.isConfigured()) return false;

  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.tryAutoDeliveryBooking) return false;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, address: true, customer: true, delivery: true },
  });
  if (!order || order.fulfilmentType !== "DELIVERY" || !order.address || order.delivery) return false;

  const weightGrams = order.items.reduce((sum, item) => sum + item.product.weightGrams * item.quantity, 0);
  const pickup: DeliveryAddress = { line1: settings.pickupAddress, city: "Chennai", state: "Tamil Nadu", pincode: "" };
  const drop: DeliveryAddress = {
    line1: order.address.line1,
    line2: order.address.line2,
    landmark: order.address.landmark,
    area: order.address.area,
    city: order.address.city,
    state: order.address.state,
    pincode: order.address.pincode,
  };

  try {
    const quote = await porter.getQuote(pickup, drop, weightGrams);
    const booking = await porter.createBooking({ orderId: order.orderNumber, pickup, drop, weightGrams });

    await prisma.delivery.create({
      data: {
        orderId: order.id,
        provider: "PORTER",
        externalOrderId: booking.externalOrderId,
        trackingUrl: booking.trackingUrl,
        status: booking.status,
        quotedFarePaise: quote?.farePaise ?? null,
      },
    });
    // Delivery charge is always billed to the customer, never the bakery, and collected separately.
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "OUT_FOR_DELIVERY",
        deliveryChargePaise: quote?.farePaise ?? null,
        deliveryChargeStatus: quote?.farePaise ? "PENDING" : "NOT_APPLICABLE",
      },
    });
    await prisma.orderStatusEvent.create({
      data: { orderId: order.id, fromStatus: "PACKED", toStatus: "OUT_FOR_DELIVERY", actor: "SYSTEM", note: "Porter auto-booked for pickup" },
    });

    let paymentLink = "";
    if (quote?.farePaise) {
      try {
        const link = await getPaymentProvider().createPaymentLink({
          amountPaise: quote.farePaise,
          description: `Delivery charge for order ${order.orderNumber}`,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          referenceId: `${order.orderNumber}-delivery`,
        });
        paymentLink = link.shortUrl;
      } catch {
        // Payment link creation failed — admin can send one manually; never block the booking.
      }
    }

    const message = renderTemplate(DEFAULT_WHATSAPP_TEMPLATES.DELIVERY_ARRANGED, {
      name: order.customer.name,
      orderId: order.orderNumber,
      riderName: "Porter",
      riderPhone: "",
      paymentLink,
    });
    await sendWhatsAppMessage({ to: order.customer.phone, body: message, relatedOrderId: order.id });
    return true;
  } catch {
    return false; // Booking failed — admin falls back to the manual "Arrange delivery" panel.
  }
}
