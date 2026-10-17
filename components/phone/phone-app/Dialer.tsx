"use client";

import { Delete, Phone } from "lucide-react";
import { DialerKeypad } from "./DialerKeypad";
import { DEMO_NUMBER_DISPLAY, formatPhoneNumber } from "@/lib/phone/demo";
import { cn } from "@/lib/cn";

export interface DialerProps {
  dialed: string;
  numberError: string | null;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onCall: () => void;
}

/** The Phone app's Keypad tab: number display, dial pad, and a call action. */
export function Dialer({
  dialed,
  numberError,
  onKey,
  onBackspace,
  onCall,
}: DialerProps) {
  const hasDialed = dialed.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3">
      <div className="flex min-h-[3.5rem] items-center justify-center">
        <p
          className={cn(
            "text-center font-display text-3xl font-semibold tracking-wide [overflow-wrap:anywhere]",
            hasDialed ? "text-forest-900" : "text-muted/70",
          )}
        >
          {hasDialed ? formatPhoneNumber(dialed) : "Enter a number"}
        </p>
      </div>

      <p
        role={numberError ? "alert" : undefined}
        className={cn(
          "mb-1 min-h-[1.25rem] text-center text-xs font-semibold",
          numberError ? "text-alert-700" : "text-muted",
        )}
      >
        {numberError ?? `Saathi demo number: ${DEMO_NUMBER_DISPLAY}`}
      </p>

      <div className="flex flex-1 items-center justify-center py-1">
        <DialerKeypad onKey={onKey} className="w-full max-w-[280px]" />
      </div>

      <div className="relative mt-2 flex items-center justify-center">
        <button
          type="button"
          onClick={onCall}
          disabled={!hasDialed}
          aria-label="Call"
          className="focus-ring grid h-16 w-16 place-items-center rounded-full bg-forest text-white shadow-lift transition-colors hover:bg-forest-600 disabled:opacity-50"
        >
          <Phone className="h-7 w-7" aria-hidden="true" />
        </button>

        {hasDialed ? (
          <button
            type="button"
            onClick={onBackspace}
            aria-label="Delete last digit"
            className="focus-ring absolute right-2 grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ivory-200"
          >
            <Delete className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
