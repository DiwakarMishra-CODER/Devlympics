"use client";

import { Delete } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { AppLanguage } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  language: AppLanguage;
  className?: string;
}

const KEYS: ReadonlyArray<string | null> = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  null, "0", "back",
];

/** Large, phone-style keypad for entering a four-digit ticket. */
export function Keypad({
  onDigit,
  onBackspace,
  disabled = false,
  language,
  className,
}: KeypadProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2.5", className)}>
      {KEYS.map((key, index) => {
        if (key === null) {
          return <span key={`gap-${index}`} aria-hidden="true" />;
        }
        if (key === "back") {
          return (
            <button
              key="back"
              type="button"
              disabled={disabled}
              onClick={onBackspace}
              aria-label={language === "hi-IN" ? "मिटाएँ" : "Delete"}
              className="focus-ring grid h-16 place-items-center rounded-2xl bg-ivory-200 text-forest-900 transition-colors hover:bg-ivory-200/70 disabled:opacity-50"
            >
              <Icon icon={Delete} size="lg" />
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="focus-ring grid h-16 place-items-center rounded-2xl border border-line bg-white font-display text-2xl font-semibold text-forest-900 shadow-soft transition-colors hover:bg-sage-50 disabled:opacity-50"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
