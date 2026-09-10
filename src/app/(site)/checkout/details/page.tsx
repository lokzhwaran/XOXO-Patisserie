import { CheckoutDetailsForm } from "@/components/checkout-details-form";
import { CheckoutStepper } from "@/components/checkout-stepper";
import { getSiteSettings } from "@/lib/site-settings";

export default async function CheckoutDetailsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <CheckoutStepper current="details" />
      <h1 className="mt-8 font-heading text-3xl">Your Details</h1>
      <div className="mt-8">
        <CheckoutDetailsForm deliveryNote={settings.deliveryNote} />
      </div>
    </div>
  );
}
