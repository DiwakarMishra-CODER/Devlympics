"use client";

import { BadgeCheck } from "lucide-react";
import type { Domain } from "@/lib/types";
import { cn } from "@/lib/cn";

export type DomainFilter = Domain | "all";

const filters: ReadonlyArray<{ value: DomainFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "farming", label: "Farming" },
  { value: "schemes", label: "Schemes" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

export interface FilterChipsProps {
  value: DomainFilter;
  onChange: (value: DomainFilter) => void;
  counts: Record<DomainFilter, number>;
  className?: string;
}

/** Controlled domain filter. Rendered as pressed-state buttons for screen readers. */
export function FilterChips({ value, onChange, counts, className }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter cases by domain"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {filters.map((filter) => {
        const selected = filter.value === value;
        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(filter.value)}
            className={cn(
              "focus-ring inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              selected
                ? "border-forest bg-forest text-ivory"
                : "border-line bg-white text-ink-soft hover:border-forest/30 hover:text-forest-700",
            )}
          >
            {filter.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums",
                selected ? "bg-ivory/20 text-ivory" : "bg-ivory-200 text-ink-soft",
              )}
            >
              {counts[filter.value]}
            </span>
          </button>
        );
      })}

      {value !== "all" ? (
        <button
          type="button"
          onClick={() => onChange("all")}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold text-muted underline-offset-2 hover:text-forest-700 hover:underline"
        >
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Clear filter
        </button>
      ) : null}
    </div>
  );
}
