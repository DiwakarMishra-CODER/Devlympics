"use client";

import { cn } from "@/lib/cn";
import type { AppLanguage } from "@/lib/types";

const options: ReadonlyArray<{ value: AppLanguage; label: string }> = [
  { value: "hi-IN", label: "हिंदी" },
  { value: "en-IN", label: "English" },
];

export interface LanguageToggleProps {
  value: AppLanguage;
  onChange: (value: AppLanguage) => void;
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Two-way language switch. Implemented as a labelled group of toggle buttons
 * (aria-pressed) rather than a radio group so it needs no roving-tabindex
 * keyboard handling.
 */
export function LanguageToggle({
  value,
  onChange,
  tone = "dark",
  className,
}: LanguageToggleProps) {
  const onDark = tone === "light";

  return (
    <div
      role="group"
      aria-label="भाषा चुनें / Choose language"
      className={cn(
        "inline-flex rounded-full p-1",
        onDark ? "bg-white/10" : "bg-ivory-200",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              active
                ? onDark
                  ? "bg-saffron text-forest-900"
                  : "bg-forest text-ivory"
                : onDark
                  ? "text-ivory/70 hover:text-ivory"
                  : "text-muted hover:text-forest-700",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
