import * as React from "react";
import { cn } from "./button";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "warning" | "danger" | "success" }) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
    warning: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
    danger: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
    success: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
