"use client";

import { ChevronRight, Search, X } from "lucide-react";
import { domainLabel, formatRelative, humaniseProblemKey } from "@/lib/labels";
import type { Case, CaseStatus, Domain, Ticket } from "@/lib/types";
import { cn } from "@/lib/cn";
import { STATUS_META, STATUS_ORDER } from "./status";
import type { StatusFilter } from "./Headline";

export type DomainFilter = Domain | "all";

export interface CaseLedgerProps {
  cases: readonly Case[];
  /** Counts per status before the status filter is applied (for the tabs). */
  statusCounts: Record<StatusFilter, number>;
  status: StatusFilter;
  onStatus: (status: StatusFilter) => void;
  domain: DomainFilter;
  onDomain: (domain: DomainFilter) => void;
  query: string;
  onQuery: (query: string) => void;
  clusterLabel: string | null;
  onClearCluster: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isNew: (ticket: Ticket) => boolean;
  selectedTicket: Ticket | null;
  onOpen: (ticket: Ticket) => void;
  now: number;
}

const DOMAINS: readonly DomainFilter[] = ["all", "farming", "schemes", "health", "other"];

function StatusTag({ status }: { status: CaseStatus }) {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", meta.tone)}>
      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/** The case list: status tabs, domain + search, then one calm row per case. */
export function CaseLedger(props: CaseLedgerProps) {
  const { cases, statusCounts, status, onStatus, domain, onDomain, query, onQuery } = props;

  const tabs: ReadonlyArray<{ key: StatusFilter; label: string }> = [
    { key: "all", label: "All" },
    ...STATUS_ORDER.map((key) => ({ key, label: STATUS_META[key].label })),
  ];

  return (
    <section aria-labelledby="cases-heading" className="rounded-[1.75rem] border border-line bg-white">
      <div className="flex flex-col gap-4 border-b border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="cases-heading" className="font-display text-xl font-semibold text-ink">
            Cases
          </h2>
          <label className="relative flex w-full items-center sm:w-72">
            <span className="sr-only">Search by ticket, name or district</span>
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Ticket, name or district"
              className="focus-ring h-10 w-full rounded-full border border-line bg-ivory pl-9 pr-3 text-sm text-ink placeholder:text-muted"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-full bg-ivory p-1">
            {tabs.map((tab) => {
              const selected = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onStatus(tab.key)}
                  className={cn(
                    "focus-ring cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-150",
                    selected ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {tab.label}
                  <span className={cn("ml-1.5 tabular-nums", selected ? "text-ivory/70" : "text-muted")}>
                    {statusCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by topic" role="group">
            {DOMAINS.map((key) => {
              const selected = domain === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onDomain(key)}
                  className={cn(
                    "focus-ring cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-150",
                    selected ? "border-forest bg-forest text-ivory" : "border-line text-ink-soft hover:border-ink-soft",
                  )}
                >
                  {key === "all" ? "All topics" : domainLabel(key, "en-IN")}
                </button>
              );
            })}
          </div>

          {props.clusterLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-100 py-1 pl-3 pr-1 text-xs font-semibold text-saffron-700">
              {props.clusterLabel}
              <button
                type="button"
                onClick={props.onClearCluster}
                aria-label="Clear district filter"
                className="focus-ring grid h-6 w-6 cursor-pointer place-items-center rounded-full hover:bg-saffron/30"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ) : null}
        </div>
      </div>

      {props.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-alert-700">
          Could not load cases: {props.error}
          <button type="button" onClick={props.onRetry} className="focus-ring cursor-pointer rounded-full border border-alert-100 px-3 py-1.5 font-semibold">
            Try again
          </button>
        </div>
      ) : props.loading ? (
        <ul aria-hidden="true" className="divide-y divide-line">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="px-6 py-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-ink/5" />
            </li>
          ))}
        </ul>
      ) : cases.length === 0 ? (
        <p className="px-6 py-14 text-center text-sm text-ink-soft">
          {statusCounts.all === 0 && !query && domain === "all" && !props.clusterLabel
            ? "No calls yet. Cases appear here the moment a caller finishes talking to Saathi."
            : "No cases match these filters."}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {cases.map((item) => {
            const selected = props.selectedTicket === item.ticket;
            const problem = item.problem || humaniseProblemKey(item.problemKey) || "Problem not recorded";
            return (
              <li key={item.ticket}>
                <button
                  type="button"
                  onClick={() => props.onOpen(item.ticket)}
                  aria-label={`Open case ${item.ticket}: ${problem}, ${STATUS_META[item.status].label}`}
                  className={cn(
                    "focus-ring group relative grid w-full cursor-pointer grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors duration-300 sm:grid-cols-[5rem_minmax(0,1.1fr)_minmax(0,1.4fr)_auto_auto] sm:px-6",
                    props.isNew(item.ticket) ? "bg-sage-100" : selected ? "bg-ivory" : "hover:bg-ivory",
                  )}
                >
                  {item.severity === "high" ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-alert-500" aria-hidden="true" />
                  ) : null}

                  <span className="col-start-1 row-start-1 font-mono text-base font-semibold tabular-nums tracking-wider text-ink">
                    {item.ticket}
                  </span>

                  <span className="col-start-2 row-start-1 min-w-0">
                    <span className="block truncate font-semibold text-ink">{item.name ?? "Unnamed caller"}</span>
                    <span className="block truncate text-sm text-ink-soft">
                      {item.district ?? "District not given"} · {item.language === "hi-IN" ? "Hindi" : "English"}
                    </span>
                  </span>

                  <span className="col-span-3 col-start-1 row-start-2 min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                    <span className="block truncate text-ink">
                      {item.subject ? <span className="font-semibold">{item.subject} · </span> : null}
                      {problem}
                    </span>
                    <span className="block truncate text-sm text-ink-soft">
                      {domainLabel(item.domain, "en-IN")}
                      {item.severity === "high" ? <span className="font-semibold text-alert-700"> · High severity</span> : null}
                      {item.source === "seed" ? <span className="text-saffron-700"> · Sample</span> : null}
                    </span>
                  </span>

                  <span className="col-start-3 row-start-1 flex flex-col items-end gap-1 sm:col-start-4">
                    <StatusTag status={item.status} />
                    <span className="text-xs text-muted">{formatRelative(item.createdAt, props.now)}</span>
                  </span>

                  <ChevronRight
                    className="hidden h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 sm:col-start-5 sm:row-start-1 sm:block"
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
