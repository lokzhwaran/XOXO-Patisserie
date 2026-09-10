const STEPS = [
  { key: "details", label: "Details" },
  { key: "payment", label: "Payment" },
  { key: "confirmation", label: "Confirmation" },
] as const;

export function CheckoutStepper({ current }: { current: (typeof STEPS)[number]["key"] }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-4">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              i <= currentIndex
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-sm ${i === currentIndex ? "font-semibold" : "text-[var(--color-muted-foreground)]"}`}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && <div className="mx-2 h-px w-8 bg-[var(--color-border)]" />}
        </div>
      ))}
    </div>
  );
}
