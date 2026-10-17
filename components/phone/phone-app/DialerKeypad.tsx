"use client";

import { cn } from "@/lib/cn";

interface KeySpec {
  digit: string;
  letters: string;
}

const KEYS: readonly KeySpec[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export interface DialerKeypadProps {
  onKey: (key: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Classic 3×4 dial pad with the familiar letter groupings. */
export function DialerKeypad({ onKey, disabled = false, className }: DialerKeypadProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-x-5 gap-y-3", className)}>
      {KEYS.map((key) => (
        <button
          key={key.digit}
          type="button"
          disabled={disabled}
          onClick={() => onKey(key.digit)}
          className="focus-ring flex h-14 flex-col items-center justify-center rounded-full text-forest-900 transition-colors hover:bg-forest-50 active:bg-sage-100 disabled:opacity-50"
        >
          <span className="font-display text-2xl font-semibold leading-none">
            {key.digit}
          </span>
          <span className="mt-0.5 h-3 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">
            {key.letters}
          </span>
        </button>
      ))}
    </div>
  );
}
