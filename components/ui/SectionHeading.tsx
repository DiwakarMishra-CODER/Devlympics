import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 font-display text-2xl font-semibold text-forest-900 sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
