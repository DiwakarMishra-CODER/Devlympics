"use client";

import { Phone, PhoneOff } from "lucide-react";

export interface IncomingCallScreenProps {
  label: string;
  number: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Simulated incoming call. No real telephony: no permissions are requested and
 * nothing dials out — this is a UI rehearsal of the follow-up call experience.
 */
export function IncomingCallScreen({
  label,
  number,
  onAccept,
  onDecline,
}: IncomingCallScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-forest-900 px-6 pb-8 pt-10 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
        Incoming call
      </p>

      <div className="relative mt-8 grid place-items-center">
        <span
          aria-hidden="true"
          className="absolute h-28 w-28 rounded-full bg-forest-500/40 animate-pulse-ring motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="absolute h-28 w-28 rounded-full bg-forest-500/30 animate-pulse-ring [animation-delay:0.6s] motion-reduce:animate-none"
        />
        <span className="relative grid h-24 w-24 place-items-center rounded-full bg-saffron text-forest-900 shadow-lift">
          <Phone className="h-10 w-10" strokeWidth={1.6} aria-hidden="true" />
        </span>
      </div>

      <h1 className="mt-8 font-display text-3xl font-semibold">{label}</h1>
      <p className="mt-1.5 text-sm text-white/70">{number}</p>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80">
        Saathi is calling back about your case. Press the green button to answer.
      </p>

      <div className="mt-auto flex w-full items-end justify-center gap-12 pt-10">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline call"
            className="focus-ring grid h-16 w-16 place-items-center rounded-full bg-alert-500 text-white shadow-lift transition-colors hover:bg-alert-600"
          >
            <PhoneOff className="h-6 w-6" aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold text-white/80">Decline</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            aria-label="Answer call"
            className="focus-ring grid h-20 w-20 place-items-center rounded-full bg-sage-400 text-forest-900 shadow-lift transition-colors hover:bg-sage-200"
          >
            <Phone className="h-8 w-8" aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold text-white/80">Answer</span>
        </div>
      </div>
    </div>
  );
}
