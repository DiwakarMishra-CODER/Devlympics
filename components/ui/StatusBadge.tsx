import { Badge, type BadgeTone } from "./Badge";
import type { CaseStatus } from "@/lib/types";

const statusConfig: Record<
  CaseStatus,
  { tone: BadgeTone; label: string }
> = {
  open: { tone: "forest", label: "Open" },
  follow_up_due: { tone: "saffron", label: "Follow-up due" },
  escalated: { tone: "alert", label: "Escalated" },
  resolved: { tone: "success", label: "Resolved" },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const config = statusConfig[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}
