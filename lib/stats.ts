import type { Case, DashboardStats } from "./types";

/** Summary counts derived from real case data — never hardcoded. */
export function computeStats(cases: readonly Case[]): DashboardStats {
  const stats: DashboardStats = {
    open: 0,
    followUpDue: 0,
    escalated: 0,
    resolved: 0,
    total: cases.length,
  };

  for (const item of cases) {
    switch (item.status) {
      case "open":
        stats.open += 1;
        break;
      case "follow_up_due":
        stats.followUpDue += 1;
        break;
      case "escalated":
        stats.escalated += 1;
        break;
      case "resolved":
        stats.resolved += 1;
        break;
    }
  }

  return stats;
}
