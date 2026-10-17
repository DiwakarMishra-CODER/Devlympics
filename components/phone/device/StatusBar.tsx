"use client";

import { useEffect, useState } from "react";
import { Battery, Signal, Wifi } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StatusBarProps {
  tone?: "light" | "dark";
  className?: string;
}

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Native-style status bar. The clock starts empty and fills in on mount so the
 * server and first client render agree.
 */
export function StatusBar({ tone = "light", className }: StatusBarProps) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = (): void => setClock(formatClock(new Date()));
    update();
    const timer = setInterval(update, 20_000);
    return () => clearInterval(timer);
  }, []);

  const onLight = tone === "light";

  return (
    <div
      className={cn(
        "relative z-30 flex shrink-0 items-center justify-between px-5 pt-2.5 text-[0.72rem] font-semibold",
        onLight ? "text-white/90" : "text-ink-soft",
        className,
      )}
    >
      <span className="tabular-nums">{clock}</span>

      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2",
          onLight ? "bg-forest-900 ring-black/30" : "bg-ink ring-black/10",
        )}
      />

      <span className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" aria-hidden="true" />
        <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
        <Battery className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  );
}
