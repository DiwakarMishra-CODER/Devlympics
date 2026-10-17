"use client";

import { Database, FastForward, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DashboardAction } from "@/hooks/useDashboard";
import type { Ticket } from "@/lib/types";

export interface DemoControlsProps {
  onLoad: () => void;
  onClear: () => void;
  onFastForward: (ticket: Ticket) => void;
  busy: DashboardAction | null;
  seedCount: number;
  liveCount: number;
  selectedTicket: Ticket | null;
}

/**
 * Console actions. These call the real data-layer functions — seeding only ever
 * writes `source: "seed"` rows, so clearing can never delete live cases.
 */
export function DemoControls({
  onLoad,
  onClear,
  onFastForward,
  busy,
  seedCount,
  liveCount,
  selectedTicket,
}: DemoControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted sm:inline-flex">
        <span className="text-saffron-700">{seedCount} demo</span>
        <span aria-hidden="true" className="h-3 w-px bg-line" />
        <span className="text-forest-700">{liveCount} live</span>
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onLoad}
        disabled={busy !== null}
      >
        <Database className="h-4 w-4" aria-hidden="true" />
        {busy === "seed" ? "Loading…" : "Load sample data"}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={busy !== null || seedCount === 0}
        title={
          seedCount === 0
            ? "No demo cases loaded"
            : "Removes only demo-seeded cases, never live cases"
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {busy === "clear" ? "Clearing…" : "Clear sample data"}
      </Button>

      <Button
        variant="accent"
        size="sm"
        onClick={() => selectedTicket && onFastForward(selectedTicket)}
        disabled={busy !== null || !selectedTicket}
        title={
          selectedTicket
            ? `Trigger the follow-up call for ticket ${selectedTicket}`
            : "Open a case first (View), then fast-forward it"
        }
      >
        <FastForward className="h-4 w-4" aria-hidden="true" />
        {busy === "follow-up" ? "Scheduling…" : "Fast-forward 3 days"}
      </Button>
    </div>
  );
}
