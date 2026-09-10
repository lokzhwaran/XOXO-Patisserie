"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  if (items.length === 0) return null;
  return (
    <Accordion.Root type="single" collapsible className="flex flex-col divide-y divide-[var(--color-border)]">
      {items.map((item, i) => (
        <Accordion.Item key={i} value={`item-${i}`} className="py-4">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between text-left font-medium">
              {item.q}
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {item.a}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
