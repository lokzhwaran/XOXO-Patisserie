const STEPS = [
  { key: "details", label: "Details" },
  { key: "payment", label: "Payment" },
  { key: "confirmation", label: "Confirmation" },
] as const;

export function CheckoutStepper({ current }: { current: (typeof STEPS)[number]["key"] }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 max-w-full overflow-hidden">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-medium ${
              i <= currentIndex
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xs"
                : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-xs sm:text-sm whitespace-nowrap ${i === currentIndex ? "font-semibold text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"}`}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && <div className="mx-1 sm:mx-2 h-px w-3 sm:w-8 bg-[var(--color-border)] shrink-0" />}
        </div>
      ))}
    </div>
  );
}
