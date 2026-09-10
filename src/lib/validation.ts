import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const pincodeSchema = z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode");

export const checkoutDetailsSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    phone: phoneSchema,
    altPhone: phoneSchema.optional().or(z.literal("")),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    fulfilmentType: z.enum(["DELIVERY", "PICKUP"]),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
    area: z.string().optional(),
    city: z.string().default("Chennai"),
    state: z.string().default("Tamil Nadu"),
    pincode: z.string().optional(),
    requestedDate: z.string().min(1, "Choose a delivery date"),
    requestedTimeSlot: z.string().min(1, "Choose a time slot"),
    deliveryInstructions: z.string().optional(),
    occasionMessage: z.string().optional(),
    saveDetails: z.boolean().default(true),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.altPhone && data.altPhone === data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alternate phone must differ from primary phone",
        path: ["altPhone"],
      });
    }
    if (data.fulfilmentType === "DELIVERY") {
      if (!data.addressLine1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address is required for delivery",
          path: ["addressLine1"],
        });
      }
      if (!data.pincode || !/^\d{6}$/.test(data.pincode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid 6-digit pincode",
          path: ["pincode"],
        });
      }
    }
  });

export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;

export const cartItemInputSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int().positive().max(50),
});

export const createOrderSchema = z.object({
  details: checkoutDetailsSchema,
  items: z.array(cartItemInputSchema).min(1, "Cart is empty"),
});

export const trackOrderSchema = z.object({
  phone: phoneSchema,
  orderNumber: z.string().min(4),
});

export const notifyMeSchema = z.object({
  productId: z.string(),
  date: z.string(),
  phone: phoneSchema,
});
