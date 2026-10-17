import { Sprout } from "lucide-react";
import { cn } from "@/lib/cn";

export interface LogoProps {
  /** "light" for dark backgrounds (phone), "dark" for light surfaces. */
  variant?: "dark" | "light";
  className?: string;
}

export function Logo({ variant = "dark", className }: LogoProps) {
  const onDark = variant === "light";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-2xl",
          onDark ? "bg-saffron text-forest-900" : "bg-forest text-saffron",
        )}
      >
        <Sprout width={22} height={22} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-semibold",
            onDark ? "text-ivory" : "text-forest-900",
          )}
        >
          Saathi
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[0.65rem] font-semibold uppercase tracking-[0.24em]",
            onDark ? "text-ivory/60" : "text-muted",
          )}
        >
          AI case worker
        </span>
      </span>
    </span>
  );
}
