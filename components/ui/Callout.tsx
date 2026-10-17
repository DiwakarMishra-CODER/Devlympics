import type { LucideIcon } from "lucide-react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

export type CalloutTone = "advice" | "info" | "warning";

const toneConfig: Record<
  CalloutTone,
  { icon: LucideIcon; wrap: string; badge: string; title: string }
> = {
  advice: {
    icon: Lightbulb,
    wrap: "border-saffron-300 bg-saffron-50",
    badge: "bg-saffron-100 text-saffron-700",
    title: "text-saffron-700",
  },
  info: {
    icon: Info,
    wrap: "border-line bg-ivory-50",
    badge: "bg-sage-100 text-forest-600",
    title: "text-forest-700",
  },
  warning: {
    icon: TriangleAlert,
    wrap: "border-alert-100 bg-alert-50",
    badge: "bg-alert-100 text-alert-700",
    title: "text-alert-700",
  },
};

export interface CalloutProps {
  tone?: CalloutTone;
  title: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Visually separates machine-generated advice from case status / ticket facts,
 * which is a safety requirement: the person must never confuse a suggestion
 * with a confirmed outcome.
 */
export function Callout({ tone = "info", title, children, className }: CalloutProps) {
  const config = toneConfig[tone];
  return (
    <div className={cn("rounded-2xl border p-4", config.wrap, className)}>
      <p className={cn("flex items-center gap-2 text-sm font-bold", config.title)}>
        <span className={cn("grid h-6 w-6 place-items-center rounded-lg", config.badge)}>
          <Icon icon={config.icon} size="sm" />
        </span>
        {title}
      </p>
      {children ? (
        <div className="mt-2 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
