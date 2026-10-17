"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MessageSquareText, PhoneCall, X } from "lucide-react";
import { iconSpec } from "@/lib/icons";
import { domainLabel, formatDateTime, formatRelative, humaniseProblemKey } from "@/lib/labels";
import type { Case, Ticket } from "@/lib/types";
import { cn } from "@/lib/cn";
import { STATUS_META } from "./status";

export interface CaseDetailDrawerProps {
  item: Case | null;
  onClose: () => void;
  onFastForward: (ticket: Ticket) => void;
  followUpBusy: boolean;
  now: number;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** The full case file. Closes on Escape, backdrop click, or the X; keeps Tab inside. */
export function CaseDetailDrawer({ item, onClose, onFastForward, followUpBusy, now }: CaseDetailDrawerProps) {
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
      if (event.key !== "Tab") return;
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

  const meta = STATUS_META[item.status];
  const StatusIcon = meta.icon;
  const sms = item.smsText.replaceAll("#TICKET", item.ticket);
  const problem = item.problem || humaniseProblemKey(item.problemKey) || "Problem not recorded";
  const canCall = item.status !== "resolved";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-drawer-title"
        className="relative flex h-full w-full max-w-[580px] flex-col bg-ivory shadow-phone animate-fade-up motion-reduce:animate-none"
      >
        <header className="border-b border-line px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted">
                Case <span className="font-mono tracking-wider text-ink">#{item.ticket}</span>
                {item.source === "seed" ? <span className="text-saffron-700"> · Sample</span> : null}
              </p>
              <h2 id="case-drawer-title" className="mt-2 font-display text-[1.9rem] font-medium leading-tight text-ink">
                {item.subject ? `${item.subject}: ` : ""}
                {problem}
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {item.name ?? "Unnamed caller"} · {item.district ?? "District not given"} · {domainLabel(item.domain, "en-IN")} ·{" "}
                {item.language === "hi-IN" ? "Hindi" : "English"}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close case"
              className="focus-ring grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink hover:bg-ivory-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className={cn("mt-4 flex items-center gap-3 rounded-2xl px-4 py-3", meta.tone)}>
            <StatusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">
              <span className="font-bold">{meta.label}.</span> {meta.hint}
              {item.severity === "high" ? <span className="font-bold"> · High severity</span> : null}
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {item.expertSummary ? (
            <Block title="For the expert">
              <p className="whitespace-pre-line rounded-2xl border border-alert-100 bg-white p-4 text-sm leading-relaxed text-ink">
                {item.expertSummary}
              </p>
            </Block>
          ) : null}

          <Block title="What Saathi advised">
            {item.advice ? (
              <p className="text-base leading-relaxed text-ink">{item.advice}</p>
            ) : (
              <p className="text-sm text-muted">No advice recorded yet.</p>
            )}
            {item.icons.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Steps shown to the caller">
                {item.icons.map((key) => (
                  <li key={key} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
                    {iconSpec(key).labelEn}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-xs text-muted">AI-generated guidance, not a diagnosis or prescription.</p>
          </Block>

          {sms ? (
            <Block title="SMS sent to the caller">
              <p className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                {sms}
              </p>
            </Block>
          ) : null}

          <Block title={`Conversation (${item.turns.length})`}>
            {item.turns.length === 0 ? (
              <p className="text-sm text-muted">No conversation recorded.</p>
            ) : (
              <ol className="space-y-3">
                {item.turns.map((turn) => {
                  const isSaathi = turn.role === "saathi";
                  return (
                    <li key={turn.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
                      <span className={cn("pt-0.5 text-xs font-bold uppercase tracking-wider", isSaathi ? "text-forest-700" : "text-saffron-700")}>
                        {isSaathi ? "Saathi" : "Caller"}
                      </span>
                      <span className="text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">
                        {turn.text}
                        <span className="mt-0.5 block text-[0.7rem] text-muted">{formatDateTime(turn.at)}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Block>

          <Block title="Timeline">
            <dl className="space-y-1.5 text-sm">
              {[
                ["Opened", `${formatDateTime(item.createdAt)} (${formatRelative(item.createdAt, now)})`],
                ["Last update", `${formatDateTime(item.updatedAt)} (${formatRelative(item.updatedAt, now)})`],
                ["Follow-up call", item.followUpAt ? formatDateTime(item.followUpAt) : "Not scheduled"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="text-right text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Block>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line bg-white px-6 py-4">
          <p className="text-xs leading-snug text-muted">
            {canCall ? "Rings the caller's phone now instead of in 3 days." : "This case is resolved."}
          </p>
          <button
            type="button"
            onClick={() => onFastForward(item.ticket)}
            disabled={followUpBusy || !canCall}
            className="focus-ring inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors duration-150 hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            {followUpBusy ? "Calling…" : "Call back now"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
