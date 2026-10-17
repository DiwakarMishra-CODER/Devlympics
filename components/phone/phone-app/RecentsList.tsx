"use client";

import { useEffect, useState } from "react";
import { History, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import type { RecentCall } from "@/lib/phone/recents";
import { formatDuration, formatPhoneNumber, isSampleNumber } from "@/lib/phone/demo";
import { formatRelative } from "@/lib/labels";
import { cn } from "@/lib/cn";

export interface RecentsListProps {
  recents: readonly RecentCall[];
  onCall: (number: string, callable: boolean) => void;
}

function iconFor(entry: RecentCall) {
  if (entry.outcome === "missed") return PhoneMissed;
  return entry.direction === "incoming" ? PhoneIncoming : PhoneOutgoing;
}

/** Recents tab: a plain, glanceable call log. */
export function RecentsList({ recents, onCall }: RecentsListProps) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  if (recents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ivory-200 text-muted">
          <History className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-forest-900">No recent calls</p>
        <p className="text-xs text-muted">Calls you make or receive will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="flex-1 divide-y divide-line overflow-y-auto">
      {recents.map((entry) => {
        const IconComponent = iconFor(entry);
        const missed = entry.outcome === "missed";
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onCall(entry.number, isSampleNumber(entry.number))}
              className="focus-ring flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ivory-50"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  missed ? "bg-alert-50 text-alert-600" : "bg-sage-100 text-forest-600",
                )}
              >
                <IconComponent className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    missed ? "text-alert-700" : "text-forest-900",
                  )}
                >
                  {entry.label}
                </span>
                <span className="block truncate text-xs text-muted">
                  {missed ? "Missed · " : ""}
                  {formatPhoneNumber(entry.number)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xs text-muted">
                  {now > 0 ? formatRelative(entry.at, now) : ""}
                </span>
                {entry.durationMs > 0 ? (
                  <span className="block text-[0.68rem] text-muted">
                    {formatDuration(entry.durationMs)}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
