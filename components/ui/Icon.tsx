import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  /** Provide a label to expose the icon to assistive tech (role="img"). */
  label?: string;
  strokeWidth?: number;
}

/**
 * Consistent icon rendering. Decorative by default (aria-hidden); pass `label`
 * to give it an accessible name when it carries meaning on its own.
 */
export function Icon({
  icon: Glyph,
  size = "md",
  className,
  label,
  strokeWidth = 1.75,
}: IconProps) {
  const dimension = sizeMap[size];

  if (label) {
    return (
      <Glyph
        width={dimension}
        height={dimension}
        strokeWidth={strokeWidth}
        className={className}
        role="img"
        aria-label={label}
      />
    );
  }

  return (
    <Glyph
      width={dimension}
      height={dimension}
      strokeWidth={strokeWidth}
      className={cn(className)}
      aria-hidden="true"
      focusable="false"
    />
  );
}
