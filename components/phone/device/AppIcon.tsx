"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AppIconProps {
  icon: LucideIcon;
  label: string;
  /** Solid tile colour classes, e.g. "bg-forest". */
  tileClassName?: string;
  onClick: () => void;
  badge?: number;
  className?: string;
}

/** A single home-screen app tile: rounded square + label underneath. */
export function AppIcon({
  icon: IconComponent,
  label,
  tileClassName = "bg-forest",
  onClick,
  badge,
  className,
}: AppIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring group flex flex-col items-center gap-1.5 rounded-2xl p-1 outline-none",
        className,
      )}
    >
      <span className="relative">
        <span
          className={cn(
            "grid h-[3.25rem] w-[3.25rem] place-items-center rounded-[1.15rem] text-white shadow-soft transition-transform duration-150 group-active:scale-95 sm:h-14 sm:w-14",
            tileClassName,
          )}
        >
          <IconComponent className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
        </span>
        {badge ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-alert px-1 text-[0.62rem] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="max-w-[4.6rem] truncate text-[0.68rem] font-medium text-white/90">
        {label}
      </span>
    </button>
  );
}
