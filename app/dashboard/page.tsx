"use client";

import { useEffect, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { AlertsPanel, type ClusterSelection } from "@/components/dashboard/AlertsPanel";
import { CaseDetailDrawer } from "@/components/dashboard/CaseDetailDrawer";
import { CasesTable } from "@/components/dashboard/CasesTable";
import { DashboardShell, type DataMode } from "@/components/dashboard/DashboardShell";
import { DemoControls } from "@/components/dashboard/DemoControls";
import {
  FilterChips,
  type DomainFilter,
} from "@/components/dashboard/FilterChips";
import { SummaryMetrics } from "@/components/dashboard/SummaryMetrics";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useDashboard } from "@/hooks/useDashboard";
import { humaniseProblemKey } from "@/lib/labels";
import type { Case, Ticket } from "@/lib/types";

const COUNT_DOMAINS = ["farming", "schemes", "health", "other"] as const;

export default function DashboardPage() {
  const dashboard = useDashboard();

  const [domain, setDomain] = useState<DomainFilter>("all");
  const [cluster, setCluster] = useState<ClusterSelection | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Drop the selection if its case disappears (e.g. sample data was cleared).
  useEffect(() => {
    if (selectedTicket && !dashboard.cases.some((item) => item.ticket === selectedTicket)) {
      setSelectedTicket(null);
      setDrawerOpen(false);
    }
  }, [dashboard.cases, selectedTicket]);

  const clusterFiltered = useMemo<readonly Case[]>(() => {
    if (!cluster) return dashboard.cases;
    return dashboard.cases.filter(
      (item) => item.district === cluster.district && item.problemKey === cluster.problemKey,
    );
  }, [dashboard.cases, cluster]);

  const visibleCases = useMemo<readonly Case[]>(() => {
    if (domain === "all") return clusterFiltered;
    return clusterFiltered.filter((item) => item.domain === domain);
  }, [clusterFiltered, domain]);

  const counts = useMemo<Record<DomainFilter, number>>(() => {
    const base: Record<DomainFilter, number> = {
      all: clusterFiltered.length,
      farming: 0,
      schemes: 0,
      health: 0,
      other: 0,
    };
    for (const item of clusterFiltered) {
      if ((COUNT_DOMAINS as readonly string[]).includes(item.domain)) {
        base[item.domain] += 1;
      }
    }
    return base;
  }, [clusterFiltered]);

  const selectedCase = useMemo<Case | null>(
    () => dashboard.cases.find((item) => item.ticket === selectedTicket) ?? null,
    [dashboard.cases, selectedTicket],
  );

  const dataMode: DataMode = dashboard.loading
    ? "empty"
    : dashboard.liveCount > 0
      ? "live"
      : dashboard.seedCount > 0
        ? "demo"
        : "empty";

  const handleView = (ticket: Ticket): void => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  return (
    <DashboardShell dataMode={dataMode}>
      <SectionHeading
        eyebrow="Overview"
        title="Field overview"
        description="Live cases and early-warning signals from the field, at a glance."
        actions={
          <DemoControls
            onLoad={() => void dashboard.seed()}
            onClear={() => void dashboard.clear()}
            onFastForward={(ticket) => void dashboard.fastForward(ticket)}
            busy={dashboard.actionBusy}
            seedCount={dashboard.seedCount}
            liveCount={dashboard.liveCount}
            selectedTicket={selectedTicket}
          />
        }
      />

      {dashboard.actionError ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-alert-100 bg-alert-50 px-4 py-3 text-sm font-semibold text-alert-700"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {dashboard.actionError}
        </p>
      ) : null}

      <SummaryMetrics stats={dashboard.stats} loading={dashboard.loading} />

      <AlertsPanel
        alerts={dashboard.alerts}
        loading={dashboard.loading}
        demo={dashboard.seedCount > 0}
        activeCluster={cluster}
        onSelectCluster={(next) => {
          setCluster(next);
          setDomain("all");
        }}
      />

      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips value={domain} onChange={setDomain} counts={counts} />

          {cluster ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700">
              Cluster: {cluster.district} · {humaniseProblemKey(cluster.problemKey)}
              <button
                type="button"
                onClick={() => setCluster(null)}
                className="focus-ring rounded-full px-1.5 text-forest-700 underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </span>
          ) : null}
        </div>

        <CasesTable
          cases={visibleCases}
          loading={dashboard.loading}
          error={dashboard.streamError}
          isNew={dashboard.isNew}
          selectedTicket={selectedTicket}
          onView={handleView}
          onRetry={dashboard.retry}
          now={now}
          className="min-h-[320px] max-h-[54dvh]"
        />
      </div>

      <CaseDetailDrawer
        item={drawerOpen ? selectedCase : null}
        onClose={() => setDrawerOpen(false)}
        onFastForward={(ticket) => void dashboard.fastForward(ticket)}
        followUpBusy={dashboard.actionBusy === "follow-up"}
        now={now}
      />
    </DashboardShell>
  );
}
