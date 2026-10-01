import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-[var(--radius-base)] shadow-[0_10px_24px_rgba(36,24,17,0.08)]",
  {
    variants: {
      variant: {
        primary: "bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-[var(--color-primary-foreground)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(36,24,17,0.14)]",
        secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:-translate-y-0.5 hover:opacity-95",
        outline: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:-translate-y-0.5 hover:bg-[var(--color-muted)]",
        ghost: "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
        danger: "bg-[var(--color-danger)] text-white hover:-translate-y-0.5 hover:opacity-95",
        link: "underline-offset-4 hover:underline text-[var(--color-foreground)] shadow-none",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";
