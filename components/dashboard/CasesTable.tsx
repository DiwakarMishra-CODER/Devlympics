"use client";

import { Eye, Inbox, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { domainLabel, formatDateTime, formatRelative, problemPhrase } from "@/lib/labels";
import type { Case, Ticket } from "@/lib/types";
import type { NewRowPredicate } from "@/hooks/useDashboard";
import { cn } from "@/lib/cn";

const COLUMNS = [
  "Ticket",
  "Name",
  "District",
  "Domain",
  "Subject / Problem",
  "Severity",
  "Status",
  "Created",
] as const;

export interface CasesTableProps {
  cases: readonly Case[];
  loading: boolean;
  error: string | null;
  isNew: NewRowPredicate;
  selectedTicket: Ticket | null;
  onView: (ticket: Ticket) => void;
  onRetry?: () => void;
  now: number;
  className?: string;
}

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-line/70">
          <td colSpan={COLUMNS.length + 1} className="px-4 py-2.5">
            <Skeleton className="h-5 w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

/** Compact live case list. Rows stay dense but never lose the label/value pairing. */
export function CasesTable({
  cases,
  loading,
  error,
  isNew,
  selectedTicket,
  onView,
  onRetry,
  now,
  className,
}: CasesTableProps) {
  return (
    <section
      aria-label="Live cases"
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h2 className="font-display text-base font-semibold text-forest-900">
            Live cases
          </h2>
          <p className="text-xs text-muted">
            New rows highlight for 2 seconds. Click View for the full case file.
          </p>
        </div>
        <span className="rounded-full bg-ivory-200 px-2.5 py-1 text-xs font-semibold text-ink-soft">
          {loading ? "…" : `${cases.length} ${cases.length === 1 ? "case" : "cases"}`}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Live case list</caption>
          <thead className="sticky top-0 z-10 bg-ivory-50">
            <tr className="border-b border-line text-[0.7rem] uppercase tracking-wide text-muted">
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className="px-4 py-2.5 font-semibold">
                  {column}
                </th>
              ))}
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows /> : null}

            {!loading && error ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-alert-50 text-alert-600">
                      <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-forest-900">
                      Couldn&apos;t load cases
                    </p>
                    <p className="max-w-md text-sm text-muted">{error}</p>
                    {onRetry ? (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Retry
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}

            {!loading && !error && cases.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="p-0">
                  <EmptyState
                    icon={Inbox}
                    title="No cases yet"
                    description="Cases created on the phone page appear here automatically, or load the sample data above."
                  />
                </td>
              </tr>
            ) : null}

            {!loading && !error
              ? cases.map((item) => {
                  const flashing = isNew(item.ticket);
                  const selected = selectedTicket === item.ticket;
                  return (
                    <tr
                      key={item.ticket}
                      className={cn(
                        "border-b border-line/70 transition-colors last:border-0 hover:bg-ivory-50",
                        flashing && "animate-row-flash",
                        selected && !flashing && "bg-forest-50",
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => onView(item.ticket)}
                          className="focus-ring rounded font-display text-sm font-semibold text-forest-900 underline-offset-2 hover:underline"
                        >
                          {item.ticket}
                        </button>
                        {item.source === "seed" ? (
                          <span className="ml-2 rounded-full bg-saffron-50 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-saffron-700">
                            Demo
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                        {item.name ?? <span className="text-muted">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                        {item.district ?? <span className="text-muted">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                        {domainLabel(item.domain, "en-IN")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-ink">
                          {problemPhrase(item.subject, item.problem, item.problemKey)}
                        </span>
                        <span className="block font-mono text-[0.68rem] text-muted">
                          {item.problemKey}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <SeverityBadge severity={item.severity} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                        <span className="block text-ink-soft">
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span className="block text-[0.68rem]">
                          {formatRelative(item.createdAt, now)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(item.ticket)}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
