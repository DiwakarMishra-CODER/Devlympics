"use client";

import { useMemo } from "react";
import { ArrowUpRight, Radar } from "lucide-react";
import { computeAlerts, DEFAULT_ALERT_RULE } from "@/lib/alerts";
import { humaniseProblemKey } from "@/lib/labels";
import type { Case } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface ClusterSelection {
  district: string;
  problemKey: string;
}

export interface WatchListProps {
  cases: readonly Case[];
  loading: boolean;
  active: ClusterSelection | null;
  onSelect: (cluster: ClusterSelection | null) => void;
}

const THRESHOLD = DEFAULT_ALERT_RULE.threshold;
const WATCH_FROM = 2;

/**
 * Early warning as a watchlist: every district/problem with 2+ active reports
 * this week, filling toward the alert line. Officials see a problem building,
 * not just the moment it crosses 5.
 */
export function WatchList({ cases, loading, active, onSelect }: WatchListProps) {
  const clusters = useMemo(
    () => computeAlerts(cases, new Date(), { windowDays: DEFAULT_ALERT_RULE.windowDays, threshold: WATCH_FROM }).slice(0, 6),
    [cases],
  );
  const alerting = clusters.filter((c) => c.count >= THRESHOLD).length;

  return (
    <section aria-labelledby="watch-heading" className="rounded-[1.75rem] border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="watch-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <Radar className="h-5 w-5 text-forest-600" aria-hidden="true" />
            Early warning
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Same problem, same district, last 7 days. Alert at {THRESHOLD} reports.
          </p>
        </div>
        {alerting > 0 ? (
          <span className="shrink-0 rounded-full bg-alert-500 px-2.5 py-1 text-xs font-bold text-white">
            {alerting} {alerting === 1 ? "alert" : "alerts"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-ink/5" />
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-ivory px-4 py-5 text-sm leading-relaxed text-ink-soft">
          Nothing is spreading. A district shows up here once 2 people report the same problem.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-line">
          {clusters.map((cluster) => {
            const isAlert = cluster.count >= THRESHOLD;
            const selected = active?.district === cluster.district && active.problemKey === cluster.problemKey;
            const fill = Math.min(1, cluster.count / THRESHOLD);
            const problem = cluster.subject
              ? `${cluster.subject} · ${humaniseProblemKey(cluster.problemKey)}`
              : humaniseProblemKey(cluster.problemKey);
            return (
              <li key={cluster.id}>
                <button
                  type="button"
                  onClick={() =>
                    onSelect(selected ? null : { district: cluster.district, problemKey: cluster.problemKey })
                  }
                  aria-pressed={selected}
                  className={cn(
                    "focus-ring group -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-4 rounded-xl px-2 py-3 text-left transition-colors duration-150",
                    selected ? "bg-ink text-ivory" : "hover:bg-ivory",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate font-semibold">{cluster.district}</span>
                      {isAlert ? (
                        <span className={cn("text-[0.7rem] font-bold uppercase tracking-wider", selected ? "text-saffron" : "text-alert-600")}>
                          Alert
                        </span>
                      ) : null}
                    </span>
                    <span className={cn("block truncate text-sm", selected ? "text-ivory/75" : "text-ink-soft")}>{problem}</span>
                  </span>

                  <span className="flex w-28 shrink-0 flex-col items-end gap-1.5 sm:w-36">
                    <span className="text-sm font-semibold tabular-nums">
                      {cluster.count}
                      <span className={cn("font-normal", selected ? "text-ivory/60" : "text-muted")}> / {THRESHOLD}</span>
                    </span>
                    <span
                      className={cn("h-1.5 w-full overflow-hidden rounded-full", selected ? "bg-ivory/20" : "bg-ivory-200")}
                      role="img"
                      aria-label={`${cluster.count} of ${THRESHOLD} reports needed for an alert`}
                    >
                      <span
                        className={cn("block h-full rounded-full", isAlert ? "bg-alert-500" : "bg-saffron")}
                        style={{ width: `${fill * 100}%` }}
                      />
                    </span>
                  </span>

                  <ArrowUpRight
                    className={cn("h-4 w-4 shrink-0 transition-opacity", selected ? "opacity-100" : "opacity-0 group-hover:opacity-60")}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
