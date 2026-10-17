"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Bot, FastForward, MessageSquareText, User, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/ui/Icon";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconCaseCard } from "@/components/phone/IconCaseCard";
import { domainLabel, formatDateTime, formatRelative } from "@/lib/labels";
import type { Case, Ticket } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface CaseDetailDrawerProps {
  item: Case | null;
  onClose: () => void;
  onFastForward: (ticket: Ticket) => void;
  followUpBusy: boolean;
  now: number;
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-right text-sm text-ink">{children}</dd>
    </div>
  );
}

/** Side panel with the full case file. Closes on Escape, backdrop click, or the X. */
export function CaseDetailDrawer({
  item,
  onClose,
  onFastForward,
  followUpBusy,
  now,
}: CaseDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!item) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Keep Tab inside the dialog while it is open.
      if (event.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;

        const active = document.activeElement;
        if (event.shiftKey && (active === first || !panel.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  const missing = <span className="text-muted">—</span>;
  const sms = item.smsText.replaceAll("#TICKET", item.ticket);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-drawer-title"
        className="relative flex h-full w-full max-w-[560px] flex-col bg-ivory shadow-phone animate-fade-up"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Case file
            </p>
            <h2
              id="case-drawer-title"
              className="mt-0.5 font-display text-3xl font-semibold tracking-[0.08em] text-forest-900"
            >
              {item.ticket}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {item.name ?? "Unknown caller"}
              {item.district ? ` · ${item.district}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={item.status} />
              <SeverityBadge severity={item.severity} />
              <Badge tone="neutral">{domainLabel(item.domain, "en-IN")}</Badge>
              {item.source === "seed" ? <Badge tone="saffron">Demo data</Badge> : null}
              {item.ringNow ? <Badge tone="alert">Ringing</Badge> : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close case details"
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-forest-700 hover:bg-ivory-50"
          >
            <Icon icon={X} size="md" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <section aria-label="Case details">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Details
            </h3>
            <dl className="mt-2 rounded-2xl border border-line bg-white px-4 py-2">
              <MetaRow label="Ticket">{item.ticket}</MetaRow>
              <MetaRow label="Name">{item.name ?? missing}</MetaRow>
              <MetaRow label="District">{item.district ?? missing}</MetaRow>
              <MetaRow label="Domain">{domainLabel(item.domain, "en-IN")}</MetaRow>
              <MetaRow label="Subject">{item.subject ?? missing}</MetaRow>
              <MetaRow label="Problem">{item.problem || missing}</MetaRow>
              <MetaRow label="Problem key">
                <span className="font-mono text-xs">{item.problemKey}</span>
              </MetaRow>
              <MetaRow label="Language">{item.language}</MetaRow>
            </dl>
          </section>

          {item.icons.length > 0 ? (
            <section aria-label="Advice icons">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                What the caller was told to do
              </h3>
              <IconCaseCard icons={item.icons} language="en-IN" />
            </section>
          ) : null}

          <section aria-label="Advice given">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Advice given
            </h3>
            {item.advice ? (
              <Callout tone="advice" title="AI-generated — not a diagnosis or prescription">
                {item.advice}
              </Callout>
            ) : (
              <p className="text-sm text-muted">No advice recorded.</p>
            )}
          </section>

          <section aria-label="SMS summary">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              SMS summary
            </h3>
            {sms ? (
              <p className="flex items-start gap-2 rounded-2xl border border-line bg-white p-4 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
                <Icon icon={MessageSquareText} size="md" className="mt-0.5 shrink-0 text-muted" />
                {sms}
              </p>
            ) : (
              <p className="text-sm text-muted">No SMS recorded.</p>
            )}
          </section>

          <section aria-label="Expert summary">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Expert summary
            </h3>
            {item.expertSummary ? (
              <Callout tone="warning" title="Needs a human expert">
                <span className="whitespace-pre-line">{item.expertSummary}</span>
              </Callout>
            ) : (
              <p className="text-sm text-muted">
                Not escalated — no expert summary recorded.
              </p>
            )}
          </section>

          <section aria-label="Conversation transcript">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Transcript ({item.turns.length})
            </h3>
            {item.turns.length === 0 ? (
              <p className="text-sm text-muted">No conversation recorded.</p>
            ) : (
              <ol className="space-y-2">
                {item.turns.map((turn) => {
                  const isSaathi = turn.role === "saathi";
                  return (
                    <li
                      key={turn.id}
                      className={cn("flex items-end gap-2", isSaathi ? "" : "flex-row-reverse")}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                          isSaathi ? "bg-forest text-ivory" : "bg-sage-200 text-forest-700",
                        )}
                      >
                        <Icon icon={isSaathi ? Bot : User} size="sm" />
                      </span>
                      <span
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed [overflow-wrap:anywhere]",
                          isSaathi
                            ? "rounded-bl-sm bg-forest text-ivory"
                            : "rounded-br-sm border border-line bg-white text-ink",
                        )}
                      >
                        {turn.text}
                        <span
                          className={cn(
                            "mt-1 block text-[0.65rem]",
                            isSaathi ? "text-ivory/60" : "text-muted",
                          )}
                        >
                          {formatDateTime(turn.at)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section aria-label="Status and timestamps">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Status &amp; timestamps
            </h3>
            <dl className="mt-2 rounded-2xl border border-line bg-white px-4 py-2">
              <MetaRow label="Status">
                <span className="inline-flex items-center gap-2">
                  <StatusBadge status={item.status} />
                </span>
              </MetaRow>
              <MetaRow label="Created">
                {formatDateTime(item.createdAt)}{" "}
                <span className="text-muted">({formatRelative(item.createdAt, now)})</span>
              </MetaRow>
              <MetaRow label="Updated">
                {formatDateTime(item.updatedAt)}{" "}
                <span className="text-muted">({formatRelative(item.updatedAt, now)})</span>
              </MetaRow>
              <MetaRow label="Follow-up due">
                {item.followUpAt ? formatDateTime(item.followUpAt) : missing}
              </MetaRow>
              <MetaRow label="Source">
                {item.source === "seed" ? (
                  <span className="text-saffron-700">Demo sample data</span>
                ) : (
                  "Live case"
                )}
              </MetaRow>
            </dl>
          </section>
        </div>

        <footer className="border-t border-line bg-white px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              Fast-forwarding schedules the follow-up call and sets{" "}
              <span className="font-mono">ringNow</span>.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onFastForward(item.ticket)}
                disabled={followUpBusy || item.status === "resolved"}
              >
                <FastForward className="h-4 w-4" aria-hidden="true" />
                {followUpBusy ? "Scheduling…" : "Fast-forward 3 days"}
              </Button>
            </div>
          </div>
        </footer>
      </aside>
    </div>
  );
}
