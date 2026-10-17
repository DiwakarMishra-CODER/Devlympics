"use client";

import { Home, PhoneOff, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDuration, formatPhoneNumber } from "@/lib/phone/demo";
import type { EndedCallInfo } from "@/hooks/usePhoneCall";

export interface CallEndedScreenProps {
  endedCall: EndedCallInfo | null;
  onViewCase: () => void;
  onHome: () => void;
}

/** Shown after the person hangs up, with an optional jump to the case summary. */
export function CallEndedScreen({ endedCall, onViewCase, onHome }: CallEndedScreenProps) {
  const hasTicket = Boolean(endedCall?.ticket);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-forest-900 px-6 pb-10 pt-14 text-center text-white">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-white">
        <Icon icon={PhoneOff} size="lg" />
      </span>

      <h1 className="mt-5 font-display text-2xl font-semibold">Call ended</h1>
      <p className="mt-2 text-sm text-white/70">
        {endedCall
          ? `${endedCall.label} · ${formatPhoneNumber(endedCall.number)}`
          : "The call has ended."}
      </p>

      {endedCall && endedCall.durationMs > 0 ? (
        <p className="mt-1 text-xs text-white/60">
          Duration {formatDuration(endedCall.durationMs)}
        </p>
      ) : null}

      {hasTicket && endedCall?.ticket ? (
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-saffron">
          <Icon icon={Ticket} size="sm" />
          Ticket {endedCall.ticket}
        </span>
      ) : null}

      <div className="mt-auto w-full space-y-2.5 pt-10">
        {hasTicket ? (
          <Button variant="primary" size="xl" fullWidth className="gap-2" onClick={onViewCase}>
            <Icon icon={Ticket} size="lg" />
            View case summary
          </Button>
        ) : null}
        <button
          type="button"
          onClick={onHome}
          className="focus-ring inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-8 text-lg font-semibold text-ivory transition-colors hover:bg-white/10"
        >
          <Icon icon={Home} size="lg" />
          Back to home
        </button>
      </div>
    </div>
  );
}
