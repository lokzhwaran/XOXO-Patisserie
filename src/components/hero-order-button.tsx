"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrderingPausedModal } from "@/components/ordering-paused-modal";

export function HeroOrderButton({
  label,
  ordersEnabled,
  pausedMessage,
  nextAvailableMessage,
  whatsappNumber,
}: {
  label: string;
  ordersEnabled: boolean;
  pausedMessage: string;
  nextAvailableMessage: string | null;
  whatsappNumber: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        onClick={() => {
          if (ordersEnabled) router.push("/menu");
          else setShowModal(true);
        }}
      >
        {label}
      </Button>
      {showModal && (
        <OrderingPausedModal
          message={pausedMessage}
          nextAvailableMessage={nextAvailableMessage}
          whatsappNumber={whatsappNumber}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
