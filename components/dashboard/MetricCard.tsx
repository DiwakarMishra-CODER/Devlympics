import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

export type MetricTone = "forest" | "saffron" | "alert" | "sage";

const toneClasses: Record<MetricTone, { tile: string; value: string }> = {
  forest: { tile: "bg-forest-50 text-forest-700", value: "text-forest-900" },
  saffron: { tile: "bg-saffron-50 text-saffron-700", value: "text-saffron-700" },
  alert: { tile: "bg-alert-50 text-alert-700", value: "text-alert-700" },
  sage: { tile: "bg-sage-100 text-forest-600", value: "text-forest-700" },
};

export interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: MetricTone;
  hint?: string;
  loading?: boolean;
  className?: string;
}

/** Dense summary tile sized for a projector: readable value, one supporting hint. */
export function MetricCard({
  label,
  value,
  icon: Glyph,
  tone = "forest",
  hint,
  loading = false,
  className,
}: MetricCardProps) {
  const palette = toneClasses[tone];

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white px-4 py-3.5 shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", palette.tile)}>
          <Glyph className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className={cn("mt-1 font-display text-3xl font-semibold leading-none", palette.value)}>
          {value}
        </p>
      )}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
