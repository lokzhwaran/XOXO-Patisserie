import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import type { DeliveryAddress, DeliveryBookingResult, DeliveryProvider, DeliveryQuote } from "./provider";

const LIFECYCLE = ["BOOKED", "RIDER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const;
const RIDER_NAMES = ["Ganesh Kumar", "Vasanth R.", "Suresh M."];

/**
 * Simulates a full delivery lifecycle without any external courier API. Advancing state is driven
 * manually from the Sandbox Console (or automatically on a short timer if left running), and each
 * transition is recorded as a SandboxEvent so it's visible/driveable in the console.
 */
export class SandboxDeliveryProvider implements DeliveryProvider {
  readonly name = "PORTER" as const; // presents as Porter-shaped so the UI/tests exercise the same paths

  isConfigured(): boolean {
    return true;
  }

  async getQuote(_pickup: DeliveryAddress, _drop: DeliveryAddress, weightGrams: number): Promise<DeliveryQuote> {
    const farePaise = 3000 + Math.round(weightGrams * 2);
    return { farePaise, etaMinutes: 35 };
  }

  async createBooking(params: {
    orderId: string;
    pickup: DeliveryAddress;
    drop: DeliveryAddress;
    weightGrams: number;
  }): Promise<DeliveryBookingResult> {
    const externalOrderId = `sandbox_delivery_${nanoid(12)}`;
    const riderName = RIDER_NAMES[Math.floor(Math.random() * RIDER_NAMES.length)];
    await prisma.sandboxEvent.create({
      data: {
        domain: "DELIVERY",
        eventType: "BOOKED",
        refId: externalOrderId,
        payload: { orderId: params.orderId, riderName, lifecycleIndex: 0 },
      },
    });
    return { externalOrderId, trackingUrl: `/sandbox/delivery/${externalOrderId}`, status: "BOOKED" };
  }

  async cancelBooking(externalOrderId: string): Promise<void> {
    await prisma.sandboxEvent.create({
      data: { domain: "DELIVERY", eventType: "CANCELLED", refId: externalOrderId, payload: {} },
    });
  }

  async getStatus(externalOrderId: string): Promise<string> {
    const latest = await prisma.sandboxEvent.findFirst({
      where: { domain: "DELIVERY", refId: externalOrderId },
      orderBy: { createdAt: "desc" },
    });
    return latest?.eventType ?? "UNKNOWN";
  }

  async handleWebhook(): Promise<void> {
    // Sandbox lifecycle is advanced via advanceDelivery() below, not an inbound webhook.
  }
}

/** Advances a sandbox delivery to its next lifecycle stage. Called by the Sandbox Console. */
export async function advanceSandboxDelivery(externalOrderId: string): Promise<string> {
  const events = await prisma.sandboxEvent.findMany({
    where: { domain: "DELIVERY", refId: externalOrderId },
    orderBy: { createdAt: "asc" },
  });
  const currentIndex = LIFECYCLE.indexOf((events[events.length - 1]?.eventType as (typeof LIFECYCLE)[number]) ?? "BOOKED");
  const nextIndex = Math.min(currentIndex + 1, LIFECYCLE.length - 1);
  const nextStatus = LIFECYCLE[nextIndex];

  await prisma.sandboxEvent.create({
    data: { domain: "DELIVERY", eventType: nextStatus, refId: externalOrderId, payload: {} },
  });
  return nextStatus;
}

export const sandboxDeliveryProvider = new SandboxDeliveryProvider();
