"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export function TestimonialCarousel({ testimonials }: { testimonials: { name: string; quote: string }[] }) {
  const [index, setIndex] = useState(0);
  if (testimonials.length === 0) return null;
  const current = testimonials[index];

  return (
    <div className="mx-auto max-w-xl text-center">
      <Quote className="mx-auto h-8 w-8 text-[var(--color-primary)]" />
      <p className="mt-4 text-lg italic">&quot;{current.quote}&quot;</p>
      <p className="mt-3 text-sm font-medium text-[var(--color-muted-foreground)]">— {current.name}</p>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          aria-label="Previous testimonial"
          onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5">
          {testimonials.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
            />
          ))}
        </div>
        <button aria-label="Next testimonial" onClick={() => setIndex((i) => (i + 1) % testimonials.length)}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
