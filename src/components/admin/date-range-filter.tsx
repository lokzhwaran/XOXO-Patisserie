"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS: { key: string; label: string }[] = [
  { key: "1", label: "Today" },
  { key: "7", label: "7d" },
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
];

export function DateRangeFilter({
  basePath,
  activeRange,
  from,
  to,
}: {
  basePath: string;
  activeRange: string | null;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [customOpen, setCustomOpen] = useState(Boolean(from || to));
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  function applyCustomRange() {
    if (!fromDate || !toDate) return;
    router.push(`${basePath}?from=${fromDate}&to=${toDate}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm">
        {PRESETS.map((preset) => (
          <a
            key={preset.key}
            href={`${basePath}?range=${preset.key}`}
            className={`rounded-full px-3 py-1 transition-colors ${!customOpen && activeRange === preset.key ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "hover:bg-[var(--color-muted)]"}`}
          >
            {preset.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen((open) => !open)}
          className={`rounded-full px-3 py-1 transition-colors ${customOpen ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "hover:bg-[var(--color-muted)]"}`}
        >
          Calendar
        </button>
      </div>
      {customOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <Input aria-label="From date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-auto" />
          <span className="text-sm text-[var(--color-muted-foreground)]">to</span>
          <Input aria-label="To date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-auto" />
          <Button size="sm" disabled={!fromDate || !toDate} onClick={applyCustomRange}>Apply</Button>
        </div>
      )}
    </div>
  );
}
