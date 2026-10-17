import type { DashboardAlert, Case, CaseStatus } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Only these statuses count toward an early-warning alert. */
const ACTIVE_STATUSES: ReadonlySet<CaseStatus> = new Set<CaseStatus>([
  "open",
  "follow_up_due",
  "escalated",
]);

export interface AlertRuleOptions {
  /** Rolling window in days (default 7 per the brief). */
  windowDays: number;
  /** Minimum reports before an alert fires (default 5 per the brief). */
  threshold: number;
}

export const DEFAULT_ALERT_RULE: AlertRuleOptions = {
  windowDays: 7,
  threshold: 5,
};

/**
 * Early-warning rule (project brief section 4.7). Pure and side-effect free so
 * it can be unit tested and reused by the dashboard regardless of where the
 * case data came from.
 */
export function computeAlerts(
  cases: readonly Case[],
  now: Date = new Date(),
  options: AlertRuleOptions = DEFAULT_ALERT_RULE,
): DashboardAlert[] {
  const windowStart = now.getTime() - options.windowDays * DAY_MS;
  const groups = new Map<string, Case[]>();

  for (const item of cases) {
    if (!item.district) continue;
    if (!ACTIVE_STATUSES.has(item.status)) continue;
    if (new Date(item.createdAt).getTime() < windowStart) continue;

    const key = `${item.district}__${item.problemKey}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  const alerts: DashboardAlert[] = [];

  for (const bucket of groups.values()) {
    if (bucket.length < options.threshold) continue;
    const sample = bucket[0];
    if (!sample || !sample.district) continue;

    const times = bucket.map((item) => new Date(item.createdAt).getTime());
    const firstSeen = Math.min(...times);
    const lastSeen = Math.max(...times);

    alerts.push({
      id: `${sample.district}-${sample.problemKey}`.toLowerCase().replace(/\s+/g, "-"),
      district: sample.district,
      domain: sample.domain,
      subject: sample.subject,
      problemKey: sample.problemKey,
      count: bucket.length,
      windowDays: options.windowDays,
      severity: bucket.length >= options.threshold * 2 ? "high" : "medium",
      firstSeenAt: new Date(firstSeen).toISOString(),
      lastSeenAt: new Date(lastSeen).toISOString(),
    });
  }

  return alerts.sort((a, b) => b.count - a.count);
}
