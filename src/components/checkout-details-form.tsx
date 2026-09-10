"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutDetailsSchema, type CheckoutDetailsInput } from "@/lib/validation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

interface PublicSettings {
  leadTimeHours: number;
  timeSlots: string[];
  serviceablePincodes: string[] | null;
  whatsappNumber: string;
}

export function CheckoutDetailsForm({ deliveryNote }: { deliveryNote: string }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings/public")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  const minDate = settings ? addDays(new Date(), Math.ceil(settings.leadTimeHours / 24)) : addDays(new Date(), 1);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutDetailsInput>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      fulfilmentType: "DELIVERY",
      city: "Chennai",
      state: "Tamil Nadu",
      saveDetails: true,
      requestedDate: format(minDate, "yyyy-MM-dd"),
    },
  });

  const fulfilmentType = useWatch({ control, name: "fulfilmentType" });

  async function onSubmit(data: CheckoutDetailsInput) {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      router.push("/menu");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: data,
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/checkout/payment/${result.orderNumber}`);
    } catch {
      toast.error("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:gap-6">
      <Card>
        <CardContent className="grid gap-4 p-4 sm:p-5">
          <h2 className="font-heading text-lg sm:text-xl">Your Details</h2>
          <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.fullName.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" inputMode="numeric" placeholder="98765 43210" {...register("phone")} />
              {errors.phone && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="altPhone">Alternate phone (optional)</Label>
              <Input id="altPhone" type="tel" {...register("altPhone")} />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:p-5">
          <h2 className="font-heading text-lg sm:text-xl">Fulfilment</h2>
          <div className="flex gap-3 sm:gap-4">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-base)] border border-[var(--color-border)] p-3 sm:p-4 text-sm sm:text-base font-medium has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-secondary)]/20 transition-colors">
              <input type="radio" value="DELIVERY" {...register("fulfilmentType")} className="accent-[var(--color-primary)]" /> Delivery
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-base)] border border-[var(--color-border)] p-3 sm:p-4 text-sm sm:text-base font-medium has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-secondary)]/20 transition-colors">
              <input type="radio" value="PICKUP" {...register("fulfilmentType")} className="accent-[var(--color-primary)]" /> Pickup
            </label>
          </div>

          {fulfilmentType === "DELIVERY" && (
            <p className="rounded-[var(--radius-base)] bg-[var(--color-muted)] p-3 text-xs text-[var(--color-muted-foreground)] leading-relaxed">
              {deliveryNote}
            </p>
          )}

          {fulfilmentType === "DELIVERY" && (
            <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="addressLine1">Address line 1</Label>
                <Input id="addressLine1" placeholder="Flat / House no, Building" {...register("addressLine1")} />
                {errors.addressLine1 && (
                  <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.addressLine1.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="addressLine2">Address line 2</Label>
                <Input id="addressLine2" placeholder="Street, Sector" {...register("addressLine2")} />
              </div>
              <div>
                <Label htmlFor="landmark">Landmark</Label>
                <Input id="landmark" placeholder="Near Apollo Hospital..." {...register("landmark")} />
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Input id="area" placeholder="Adyar / Anna Nagar" {...register("area")} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" inputMode="numeric" placeholder="600020" {...register("pincode")} />
                {errors.pincode && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.pincode.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="deliveryInstructions">Delivery instructions</Label>
                <Textarea id="deliveryInstructions" placeholder="Gate code, landmark, leave with security..." {...register("deliveryInstructions")} />
              </div>
            </div>
          )}

          <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="requestedDate">Preferred date</Label>
              <Input id="requestedDate" type="date" min={format(minDate, "yyyy-MM-dd")} {...register("requestedDate")} />
              {errors.requestedDate && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.requestedDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="requestedTimeSlot">Preferred time slot</Label>
              <select
                id="requestedTimeSlot"
                {...register("requestedTimeSlot")}
                className="flex h-11 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base sm:text-sm text-[var(--color-foreground)]"
              >
                {(settings?.timeSlots ?? ["10:00-13:00", "13:00-16:00", "16:00-19:00", "19:00-21:00"]).map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="occasionMessage">Occasion / message on box (optional)</Label>
            <Input id="occasionMessage" placeholder="Happy Birthday Priya! 🎉" {...register("occasionMessage")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-5">
          <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
            <input type="checkbox" defaultChecked {...register("saveDetails")} className="h-4 w-4 rounded accent-[var(--color-primary)]" /> Save my details for faster checkout next time
          </label>
          <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
            <input type="checkbox" {...register("agreeToTerms")} className="h-4 w-4 rounded accent-[var(--color-primary)]" /> I agree to the terms & conditions
          </label>
          {errors.agreeToTerms && <p className="text-xs text-[var(--color-danger)]">{errors.agreeToTerms.message}</p>}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 p-2 rounded-2xl bg-[var(--color-background)]/80 backdrop-blur-md">
        <Button type="submit" size="lg" disabled={submitting} className="w-full shadow-lg">
          {submitting ? "Placing order..." : "Continue to Payment"}
        </Button>
      </div>
    </form>
  );
}
