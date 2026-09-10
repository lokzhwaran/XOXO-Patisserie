"use client";

import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Simple add/remove list editor for two-field JSON arrays (why-us, testimonials, FAQ). */
export function TwoFieldListEditor({
  items,
  onChange,
  keyA,
  keyB,
  labelA,
  labelB,
  addLabel,
}: {
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  keyA: string;
  keyB: string;
  labelA: string;
  labelB: string;
  addLabel: string;
}) {
  function update(index: number, key: string, value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...items, { [keyA]: "", [keyB]: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={index} className="grid gap-2 rounded-[var(--radius-base)] border border-[var(--color-border)] p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-start">
          <div>
            <Label htmlFor={`${keyA}-${index}`} className="text-xs">{labelA}</Label>
            <Input id={`${keyA}-${index}`} value={item[keyA] ?? ""} onChange={(e) => update(index, keyA, e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`${keyB}-${index}`} className="text-xs">{labelB}</Label>
            <Input id={`${keyB}-${index}`} value={item[keyB] ?? ""} onChange={(e) => update(index, keyB, e.target.value)} />
          </div>
          <Button type="button" variant="outline" size="sm" className="sm:mt-5" onClick={() => remove(index)}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={add}>{addLabel}</Button>
    </div>
  );
}
