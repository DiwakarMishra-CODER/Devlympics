import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "forest"
  | "saffron"
  | "sage"
  | "alert"
  | "success";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-ivory-200 text-ink-soft",
  forest: "bg-forest-50 text-forest-700",
  saffron: "bg-saffron-50 text-saffron-700",
  sage: "bg-sage-100 text-forest-600",
  alert: "bg-alert-50 text-alert-700",
  success: "bg-sage-100 text-forest-600",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  /** Render a small leading dot, useful for status/severity pills. */
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
