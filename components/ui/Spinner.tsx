import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SpinnerProps {
  className?: string;
  /** Accessible, screen-reader-only label. */
  label?: string;
}

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <Loader2 className={cn("h-5 w-5 animate-spin", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
