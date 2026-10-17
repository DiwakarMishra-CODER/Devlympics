"use client";

import { useEffect, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { CaseDetailDrawer } from "@/components/dashboard/CaseDetailDrawer";
import { CaseLedger, type DomainFilter } from "@/components/dashboard/CaseLedger";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Headline, type StatusFilter } from "@/components/dashboard/Headline";
import { WatchList, type ClusterSelection } from "@/components/dashboard/WatchList";
import { useDashboard } from "@/hooks/useDashboard";
import { humaniseProblemKey } from "@/lib/labels";
import type { Case, Ticket } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function updatedLabel(updatedAt: number | null, now: number): string | null {
  if (updatedAt === null) return null;
  const seconds = Math.max(0, Math.round((now - updatedAt) / 1000));
  if (seconds < 5) return "updated just now";
  if (seconds < 60) return `updated ${seconds}s ago`;
  return `updated ${Math.round(seconds / 60)} min ago`;
}

export default function DashboardPage() {
  const dashboard = useDashboard();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [query, setQuery] = useState("");
  const [cluster, setCluster] = useState<ClusterSelection | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  // Everything except the status filter, so the status tabs can show counts.
  const scoped = useMemo<readonly Case[]>(() => {
    const q = query.trim().toLowerCase();
    return dashboard.cases.filter((item) => {
      if (cluster && (item.district !== cluster.district || item.problemKey !== cluster.problemKey)) return false;
      if (domain !== "all" && item.domain !== domain) return false;
      if (!q) return true;
      return [item.ticket, item.name ?? "", item.district ?? ""].some((field) => field.toLowerCase().includes(q));
    });
  }, [dashboard.cases, cluster, domain, query]);

  const statusCounts = useMemo<Record<StatusFilter, number>>(() => {
    const counts: Record<StatusFilter, number> = { all: scoped.length, open: 0, follow_up_due: 0, escalated: 0, resolved: 0 };
    for (const item of scoped) counts[item.status] += 1;
    return counts;
  }, [scoped]);

  const visible = useMemo(
    () => (status === "all" ? scoped : scoped.filter((item) => item.status === status)),
    [scoped, status],
  );

  const weekCount = useMemo(
    () => dashboard.cases.filter((item) => now - new Date(item.createdAt).getTime() <= 7 * DAY_MS).length,
    [dashboard.cases, now],
  );

  const selectedCase = dashboard.cases.find((item) => item.ticket === selectedTicket) ?? null;
  const dateLabel = new Date(now).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const connection = dashboard.status === "error" ? "offline" : dashboard.loading ? "connecting" : "live";

  return (
    <DashboardShell
      connection={connection}
      updatedLabel={updatedLabel(dashboard.updatedAt, now)}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>Numbers and alerts are computed live from every case in the database.</p>
          <p className="flex flex-wrap items-center gap-3">
            <span className="font-semibold uppercase tracking-wider">Demo tools</span>
            <button
              type="button"
              onClick={() => void dashboard.seed()}
              disabled={dashboard.actionBusy !== null}
              className="focus-ring cursor-pointer rounded underline underline-offset-4 hover:text-ink disabled:opacity-50"
            >
              {dashboard.actionBusy === "seed" ? "Loading…" : "Load sample cases"}
            </button>
            {dashboard.seedCount > 0 ? (
              <button
                type="button"
                onClick={() => void dashboard.clear()}
                disabled={dashboard.actionBusy !== null}
                className="focus-ring cursor-pointer rounded underline underline-offset-4 hover:text-ink disabled:opacity-50"
              >
                {dashboard.actionBusy === "clear" ? "Removing…" : `Remove ${dashboard.seedCount} sample cases`}
              </button>
            ) : null}
          </p>
        </div>
      }
    >
      {dashboard.actionError ? (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-2xl bg-alert-50 px-4 py-3 text-sm font-semibold text-alert-700">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {dashboard.actionError}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
        <Headline
          stats={dashboard.stats}
          loading={dashboard.loading}
          active={status}
          onSelect={setStatus}
          dateLabel={dateLabel}
          weekCount={weekCount}
        />
        <WatchList
          cases={dashboard.cases}
          loading={dashboard.loading}
          active={cluster}
          onSelect={(next) => {
            setCluster(next);
            setDomain("all");
            setStatus("all");
          }}
        />
      </div>

      <div className="mt-12">
        <CaseLedger
          cases={visible}
          statusCounts={statusCounts}
          status={status}
          onStatus={setStatus}
          domain={domain}
          onDomain={setDomain}
          query={query}
          onQuery={setQuery}
          clusterLabel={cluster ? `${cluster.district} · ${humaniseProblemKey(cluster.problemKey)}` : null}
          onClearCluster={() => setCluster(null)}
          loading={dashboard.loading}
          error={dashboard.streamError}
          onRetry={dashboard.retry}
          isNew={dashboard.isNew}
          selectedTicket={selectedTicket}
          onOpen={setSelectedTicket}
          now={now}
        />
      </div>

      <CaseDetailDrawer
        item={selectedCase}
        onClose={() => setSelectedTicket(null)}
        onFastForward={(ticket) => void dashboard.fastForward(ticket)}
        followUpBusy={dashboard.actionBusy === "follow-up"}
        now={now}
      />
    </DashboardShell>
  );
}
