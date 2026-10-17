"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { DOMAIN_LABELS, pluralise, problemPhrase } from "@/lib/labels";
import type { DashboardAlert } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface ClusterSelection {
  district: string;
  problemKey: string;
}

export interface AlertsPanelProps {
  alerts: readonly DashboardAlert[];
  loading: boolean;
  demo: boolean;
  activeCluster: ClusterSelection | null;
  onSelectCluster: (cluster: ClusterSelection | null) => void;
}

const severityStyles = {
  high: { wrap: "border-alert-100 bg-alert-50", stripe: "bg-alert-500", text: "text-alert-700" },
  medium: { wrap: "border-saffron-100 bg-saffron-50", stripe: "bg-saffron", text: "text-saffron-700" },
  low: { wrap: "border-line bg-ivory-50", stripe: "bg-forest-300", text: "text-forest-700" },
} as const;

/** District-level emerging patterns. One row per district + problem cluster. */
export function AlertsPanel({
  alerts,
  loading,
  demo,
  activeCluster,
  onSelectCluster,
}: AlertsPanelProps) {
  return (
    <section
      aria-label="Early warning alerts"
      className="flex flex-col rounded-2xl border border-line bg-white shadow-soft"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-alert-100 text-alert-700">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="font-display text-base font-semibold text-forest-900">
            Early warnings
          </h2>
          {alerts.length > 0 ? (
            <Badge tone="alert">{alerts.length}</Badge>
          ) : null}
          {demo ? <Badge tone="saffron">Demo data</Badge> : null}
        </div>
        <p className="text-xs text-muted">
          Rule: 5+ active cases (open · follow-up · escalated), same district &amp; problem, within 7 days.
        </p>
      </header>

      <div className="max-h-[212px] overflow-y-auto p-3">
        {loading ? (
          <div className="grid gap-2 md:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={TriangleAlert}
            title="No cluster crosses the threshold yet"
            description="Alerts appear when 5 or more active cases share a district and problem category in the last 7 days."
          />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {alerts.map((alert) => {
              const selected =
                activeCluster?.district === alert.district &&
                activeCluster?.problemKey === alert.problemKey;
              const palette = severityStyles[alert.severity];

              return (
                <li key={alert.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      onSelectCluster(
                        selected
                          ? null
                          : { district: alert.district, problemKey: alert.problemKey },
                      )
                    }
                    className={cn(
                      "focus-ring group flex w-full items-stretch gap-3 rounded-xl border p-3 text-left transition-colors",
                      palette.wrap,
                      selected && "ring-2 ring-forest/30",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("w-1 shrink-0 rounded-full", palette.stripe)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-display text-base font-semibold text-forest-900">
                          {alert.district}
                        </span>
                        <span className={cn("text-sm font-bold", palette.text)}>
                          {alert.count} reports
                        </span>
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                          {DOMAIN_LABELS[alert.domain].en}
                        </span>
                        {alert.severity === "high" ? (
                          <span className="rounded-full bg-alert-500 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                            High
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-ink-soft">
                        {pluralise(alert.count, "report")} of{" "}
                        <strong className="font-semibold text-ink">
                          {problemPhrase(alert.subject, alert.problemKey, alert.problemKey)}
                        </strong>{" "}
                        in the last {alert.windowDays} days.
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-forest-700">
                        {selected ? "Showing these cases" : "View these cases"}
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
