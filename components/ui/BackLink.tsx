import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BackLinkProps {
  href?: string;
  label?: string;
  /** "light" for dark backgrounds (phone page), "dark" for light ones (dashboard). */
  tone?: "light" | "dark";
  className?: string;
}

/** Back-to-home link shown on the phone and dashboard pages. */
export function BackLink({ href = "/", label = "Back", tone = "dark", className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
        tone === "light"
          ? "border border-white/20 text-white/90 hover:bg-white/10"
          : "border border-line bg-white text-forest-700 hover:bg-ivory-50",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
