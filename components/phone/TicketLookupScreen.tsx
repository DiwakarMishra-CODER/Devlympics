"use client";

import { ArrowLeft, Hash, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Keypad } from "./Keypad";
import type { AppLanguage } from "@/lib/types";
import { cn } from "@/lib/cn";

const TICKET_LENGTH = 4;

export interface TicketLookupScreenProps {
  language: AppLanguage;
  busy: boolean;
  error: string | null;
  onLookup: (raw: string) => void;
  onBack: () => void;
}

/** Existing-case entry: a big keypad plus clear validation feedback. */
export function TicketLookupScreen({
  language,
  busy,
  error,
  onLookup,
  onBack,
}: TicketLookupScreenProps) {
  const [digits, setDigits] = useState("");
  const hindi = language === "hi-IN";

  const handleDigit = (digit: string): void => {
    setDigits((current) => (current.length >= TICKET_LENGTH ? current : current + digit));
  };

  const handleBackspace = (): void => {
    setDigits((current) => current.slice(0, -1));
  };

  const complete = digits.length === TICKET_LENGTH;

  // Physical keyboard support: useful on the projector laptop, harmless on touch.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        setDigits((current) =>
          current.length >= TICKET_LENGTH ? current : current + event.key,
        );
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setDigits((current) => current.slice(0, -1));
        return;
      }
      if (event.key === "Enter" && digits.length === TICKET_LENGTH && !busy) {
        event.preventDefault();
        onLookup(digits);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [digits, busy, onLookup]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="focus-ring -ml-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold text-forest-700"
      >
        <Icon icon={ArrowLeft} size="sm" />
        {hindi ? "पीछे" : "Back"}
      </button>

      <div className="mt-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-saffron-700">
          <Icon icon={Hash} size="sm" />
          {hindi ? "पुराना केस" : "Existing case"}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-forest-900">
          {hindi ? "टिकट नंबर डालिए" : "Enter your ticket number"}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          {hindi
            ? "चार अंकों का नंबर डालिए जो साथी ने दिया था।"
            : "Enter the four-digit number Saathi gave you."}
        </p>
      </div>

      <div
        className="mt-6 flex justify-center gap-2.5"
        role="group"
        aria-label={hindi ? "टिकट अंक" : "Ticket digits"}
      >
        {Array.from({ length: TICKET_LENGTH }).map((_, index) => {
          const value = digits[index];
          const active = index === digits.length;
          return (
            <span
              key={index}
              className={cn(
                "grid h-16 w-14 place-items-center rounded-2xl border-2 font-display text-3xl font-semibold text-forest-900",
                value
                  ? "border-forest bg-white"
                  : active
                    ? "border-saffron bg-white"
                    : "border-line bg-ivory-50",
              )}
            >
              {value ?? ""}
            </span>
          );
        })}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-alert-100 bg-alert-50 px-4 py-3 text-center text-sm font-semibold text-alert-700"
        >
          {error}
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-muted">
          {hindi ? "डेमो में आज़माएँ: 4721 या 5138" : "Try in the demo: 4721 or 5138"}
        </p>
      )}

      <div className="mt-5">
        <Keypad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          disabled={busy}
          language={language}
        />
      </div>

      <div className="mt-5">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          disabled={!complete || busy}
          className="gap-2"
          onClick={() => onLookup(digits)}
        >
          <Icon icon={Search} size="lg" />
          {busy
            ? hindi
              ? "देख रहे हैं…"
              : "Looking up…"
            : hindi
              ? "केस देखें"
              : "View case"}
        </Button>
      </div>
    </div>
  );
}
