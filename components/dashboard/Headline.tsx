"use client";

import type { CaseStatus, DashboardStats } from "@/lib/types";
import { cn } from "@/lib/cn";

export type StatusFilter = CaseStatus | "all";

export interface HeadlineProps {
  stats: DashboardStats;
  loading: boolean;
  active: StatusFilter;
  onSelect: (status: StatusFilter) => void;
  dateLabel: string;
  weekCount: number;
}

function Figure({
  value,
  status,
  active,
  tone,
  onSelect,
  label,
}: {
  value: number;
  status: CaseStatus;
  active: StatusFilter;
  tone: string;
  onSelect: (status: StatusFilter) => void;
  label: string;
}) {
  const selected = active === status;
  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? "all" : status)}
      aria-pressed={selected}
      aria-label={`${value} ${label}. ${selected ? "Showing only these; press to show all." : "Show only these."}`}
      className={cn(
        "focus-ring relative -mx-1 inline-block cursor-pointer rounded-lg px-1 tabular-nums transition-colors duration-150",
        "underline decoration-2 underline-offset-[0.18em]",
        selected ? "bg-ink text-ivory decoration-transparent" : cn(tone, "hover:bg-ink/5"),
      )}
    >
      {value}
    </button>
  );
}

const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);

/**
 * The page's one answer to "what needs me today?", written as a sentence.
 * Each number filters the case list below, so reading and acting are the same gesture.
 */
export function Headline({ stats, loading, active, onSelect, dateLabel, weekCount }: HeadlineProps) {
  return (
    <section aria-labelledby="today-heading" className="max-w-[60rem]">
      <p id="today-heading" className="text-xs font-semibold uppercase tracking-[0.22em] text-saffron-700">
        Today · {dateLabel}
      </p>

      {loading ? (
        <div className="mt-4 space-y-3" aria-hidden="true">
          <div className="h-12 w-4/5 animate-pulse rounded-xl bg-ink/5" />
          <div className="h-12 w-3/5 animate-pulse rounded-xl bg-ink/5" />
        </div>
      ) : (
        <h1 className="mt-3 break-words font-display text-[clamp(1.9rem,4.2vw,3.6rem)] font-medium leading-[1.12] tracking-[-0.015em] text-ink">
          <Figure value={stats.escalated} status="escalated" active={active} onSelect={onSelect} tone="text-alert-700 decoration-alert-500/40" label="need an expert" />{" "}
          {plural(stats.escalated, "case needs", "cases need")} an expert.{" "}
          <span className="text-ink-soft">
            <Figure value={stats.followUpDue} status="follow_up_due" active={active} onSelect={onSelect} tone="text-saffron-700 decoration-saffron/60" label="follow-up calls due" />{" "}
            {plural(stats.followUpDue, "call is", "calls are")} due, and{" "}
            <Figure value={stats.open} status="open" active={active} onSelect={onSelect} tone="text-forest-700 decoration-forest-300" label="open cases" />{" "}
            {plural(stats.open, "case is", "cases are")} open.
          </span>
        </h1>
      )}

      <p className="mt-4 text-sm text-ink-soft">
        {weekCount} {plural(weekCount, "call", "calls")} in the last 7 days ·{" "}
        <button
          type="button"
          onClick={() => onSelect(active === "resolved" ? "all" : "resolved")}
          aria-pressed={active === "resolved"}
          className="focus-ring cursor-pointer rounded font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          {stats.resolved} resolved
        </button>{" "}
        · Tap a number to see those cases.
      </p>
    </section>
  );
}
