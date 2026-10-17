import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-forest-600">
        <Icon icon={icon} size="lg" />
      </span>
      <p className="font-display text-base font-semibold text-forest-900">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
