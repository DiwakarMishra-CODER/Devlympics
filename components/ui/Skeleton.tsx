import { cn } from "@/lib/cn";

/** Decorative placeholder block for loading content. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-sage-100", className)}
      aria-hidden="true"
    />
  );
}
