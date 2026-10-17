import { DEMO_CALLER_LABEL, DEMO_NUMBER, type DemoContact } from "./demo";

export type RecentOutcome = "answered" | "missed" | "declined";
export type RecentDirection = "outgoing" | "incoming";

export interface RecentCall {
  id: string;
  number: string;
  label: string;
  direction: RecentDirection;
  outcome: RecentOutcome;
  /** ISO timestamp. */
  at: string;
  durationMs: number;
  ticket: string | null;
}

/**
 * A couple of believable past calls so the Recents tab is never empty on a
 * fresh load. Purely in-memory; nothing is persisted outside the tab.
 */
export function createSeedRecents(now: number = Date.now()): RecentCall[] {
  const hoursAgo = (hours: number): string =>
    new Date(now - hours * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "seed_call_1",
      number: DEMO_NUMBER,
      label: DEMO_CALLER_LABEL,
      direction: "incoming",
      outcome: "answered",
      at: hoursAgo(26),
      durationMs: 96_000,
      ticket: "4721",
    },
    {
      id: "seed_call_2",
      number: DEMO_NUMBER,
      label: DEMO_CALLER_LABEL,
      direction: "outgoing",
      outcome: "answered",
      at: hoursAgo(3),
      durationMs: 74_000,
      ticket: null,
    },
  ];
}

export function contactMatchesQuery(contact: DemoContact, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    contact.name.toLowerCase().includes(needle) ||
    contact.number.includes(needle)
  );
}
