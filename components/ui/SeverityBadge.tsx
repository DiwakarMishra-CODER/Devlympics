import { Badge, type BadgeTone } from "./Badge";
import type { Severity } from "@/lib/types";

const severityConfig: Record<Severity, { tone: BadgeTone; label: string }> = {
  low: { tone: "sage", label: "Low" },
  medium: { tone: "saffron", label: "Medium" },
  high: { tone: "alert", label: "High" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = severityConfig[severity];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
