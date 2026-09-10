"use server";

import { prisma } from "@/lib/prisma";
import { checkoutDetailsSchema, type CheckoutDetailsInput } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/order-number";
import { reserveCapacity, CapacityExceededError } from "@/lib/capacity";
import { checkCapacityAlerts, recordBlockedByCapacityAttempt, createAlert } from "@/lib/notifications/alerts";
import { calcGstPaise } from "@/lib/money";
import { prisma as prismaClient } from "@/lib/prisma";
import type { FulfilmentType } from "@prisma/client";

export interface CreateOrderInput {
  details: CheckoutDetailsInput;
  items: { productId: string; variantId: string | null; quantity: number }[];
}

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
  capacityErrors?: { productName: string; available: number; requested: number }[];
}

const RESERVATION_MINUTES = 15;

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = checkoutDetailsSchema.safeParse(input.details);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  if (input.items.length === 0) {
    return { success: false, error: "Cart is empty" };
  }

  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return { success: false, error: "Site not configured" };
  if (!settings.ordersEnabled) {
    return { success: false, error: settings.orderingPausedMessage };
  }

  const details = parsed.data;
  const requestedDate = new Date(details.requestedDate);

  // Load product data + validate against min order value and capacity
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
  const productById = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData: {
    productId: string;
    variantId: string | null;
    nameSnapshot: string;
    codeSnapshot: string;
    unitPricePaise: number;
    unitCostPaise: number;
    quantity: number;
    lineTotalPaise: number;
  }[] = [];
  const capacityCheckItems: { productId: string; productName: string; quantity: number }[] = [];

  for (const item of input.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return { success: false, error: "One of the items in your cart is no longer available." };
    }
    let unitPrice = product.sellingPricePaise;
    let unitCost = product.costOfMakingPaise;
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (variant) {
        unitPrice += variant.priceDeltaPaise;
        unitCost += variant.costDeltaPaise;
      }
    }
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    orderItemsData.push({
      productId: product.id,
      variantId: item.variantId,
      nameSnapshot: product.name,
      codeSnapshot: product.code,
      unitPricePaise: unitPrice,
      unitCostPaise: unitCost,
      quantity: item.quantity,
      lineTotalPaise: lineTotal,
    });
    capacityCheckItems.push({ productId: product.id, productName: product.name, quantity: item.quantity });
  }

  const gst = calcGstPaise(subtotal, settings.gstRatePercent);
  const packaging = settings.packagingChargePaise;
  const total = subtotal + gst + packaging;

  if (total < settings.minOrderValuePaise) {
    return {
      success: false,
      error: `Minimum order value is ${(settings.minOrderValuePaise / 100).toFixed(0)} — please add more items.`,
    };
  }

  try {
    await reserveCapacity(capacityCheckItems, requestedDate);
  } catch (err) {
    if (err instanceof CapacityExceededError) {
      for (const item of capacityCheckItems) {
        await recordBlockedByCapacityAttempt(item.productId, requestedDate);
      }
      return {
        success: false,
        error: err.message,
        capacityErrors: [{ productName: err.productName, available: err.available, requested: err.requested }],
      };
    }
    throw err;
  }

  for (const item of capacityCheckItems) {
    await checkCapacityAlerts(item.productId, requestedDate);
  }

  // Upsert customer by phone
  const customer = await prismaClient.customer.upsert({
    where: { phone: `+91${details.phone}` },
    update: details.saveDetails
      ? { name: details.fullName, email: details.email || undefined, altPhone: details.altPhone || undefined }
      : {},
    create: {
      phone: `+91${details.phone}`,
      name: details.fullName,
      email: details.email || undefined,
      altPhone: details.altPhone || undefined,
    },
  });

  let addressId: string | undefined;
  if (details.fulfilmentType === "DELIVERY") {
    const address = await prismaClient.address.create({
      data: {
        customerId: customer.id,
        line1: details.addressLine1 ?? "",
        line2: details.addressLine2,
        landmark: details.landmark,
        area: details.area,
        city: details.city,
        state: details.state,
        pincode: details.pincode ?? "",
        deliveryInstructions: details.deliveryInstructions,
        isDefault: true,
      },
    });
    addressId = address.id;
  }

  const orderNumber = await generateOrderNumber();
  const order = await prismaClient.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      addressId,
      fulfilmentType: details.fulfilmentType as FulfilmentType,
      requestedDate,
      requestedTimeSlot: details.requestedTimeSlot,
      occasionMessage: details.occasionMessage,
      subtotalPaise: subtotal,
      gstPaise: gst,
      packagingPaise: packaging,
      totalPaise: total,
      reservationExpiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60_000),
      items: { create: orderItemsData },
      statusEvents: { create: { toStatus: "PENDING_PAYMENT", actor: "SYSTEM", note: "Order created" } },
    },
  });

  await createAlert({
    type: "NEW_ORDER",
    severity: "INFO",
    title: `New order ${order.orderNumber}`,
    body: `${customer.name} placed an order for ${(total / 100).toFixed(0)} rupees.`,
    relatedOrderId: order.id,
  });

  return { success: true, orderNumber: order.orderNumber };
}
