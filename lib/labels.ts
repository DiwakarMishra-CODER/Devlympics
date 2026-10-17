import type { AppLanguage, CaseStatus, Domain, Severity } from "./types";

/** Shared display labels so the phone and the console never drift apart. */
export const DOMAIN_LABELS: Record<Domain, { hi: string; en: string }> = {
  farming: { hi: "खेती", en: "Farming" },
  schemes: { hi: "सरकारी योजना", en: "Scheme" },
  health: { hi: "स्वास्थ्य", en: "Health" },
  other: { hi: "अन्य", en: "Other" },
};

export const STATUS_LABELS: Record<CaseStatus, { hi: string; en: string }> = {
  open: { hi: "खुला", en: "Open" },
  follow_up_due: { hi: "फ़ॉलो-अप", en: "Follow-up due" },
  escalated: { hi: "एस्केलेटेड", en: "Escalated" },
  resolved: { hi: "हल हुआ", en: "Resolved" },
};

export const SEVERITY_LABELS: Record<Severity, { hi: string; en: string }> = {
  low: { hi: "कम", en: "Low" },
  medium: { hi: "मध्यम", en: "Medium" },
  high: { hi: "गंभीर", en: "High" },
};

/** `language` defaults to English; Hindi labels stay available but dormant. */
export function domainLabel(domain: Domain, language: AppLanguage = "en-IN"): string {
  const entry = DOMAIN_LABELS[domain];
  return language === "hi-IN" ? entry.hi : entry.en;
}

/** Turns a problem key like `pension_not_received` into readable text. */
export function humaniseProblemKey(problemKey: string): string {
  const words = problemKey.replace(/_/g, " ").trim();
  if (!words) return "—";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "tomato — yellow leaves" / "pension not received" */
export function problemPhrase(
  subject: string | null,
  problem: string,
  problemKey: string,
): string {
  const base = problem && problem !== "—" ? problem : humaniseProblemKey(problemKey);
  return subject ? `${subject} — ${base}` : base;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Deterministic absolute timestamp, e.g. "17 Oct, 14:32". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = date.getDate();
  const month = MONTHS[date.getMonth()] ?? "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hours}:${minutes}`;
}

/** Coarse relative label: "just now", "3h ago", "2d ago". */
export function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
