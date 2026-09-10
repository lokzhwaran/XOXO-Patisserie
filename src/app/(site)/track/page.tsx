import { Suspense } from "react";
import { TrackOrderClient } from "@/components/track-order-client";

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl">Find My Order</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Enter the phone number you ordered with and your Order ID to see live status.
      </p>
      <Suspense>
        <TrackOrderClient />
      </Suspense>
    </div>
  );
}
