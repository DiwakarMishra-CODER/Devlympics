import { Activity, CalendarClock, CheckCircle2, Siren } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MetricCard, type MetricTone } from "./MetricCard";
import type { DashboardStats } from "@/lib/types";

const metrics: ReadonlyArray<{
  key: keyof Omit<DashboardStats, "total">;
  label: string;
  icon: LucideIcon;
  tone: MetricTone;
  hint: string;
}> = [
  { key: "open", label: "Open", icon: Activity, tone: "forest", hint: "Awaiting advice" },
  { key: "followUpDue", label: "Follow-ups due", icon: CalendarClock, tone: "saffron", hint: "Rings in 3 days" },
  { key: "escalated", label: "Escalated", icon: Siren, tone: "alert", hint: "Needs a human expert" },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, tone: "sage", hint: "Problem solved" },
];

export interface SummaryMetricsProps {
  stats: DashboardStats;
  loading: boolean;
}

/** The four headline counts, calculated from the live case snapshot. */
export function SummaryMetrics({ stats, loading }: SummaryMetricsProps) {
  return (
    <section aria-label="Summary metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          value={stats[metric.key]}
          icon={metric.icon}
          tone={metric.tone}
          hint={metric.hint}
          loading={loading}
        />
      ))}
    </section>
  );
}
