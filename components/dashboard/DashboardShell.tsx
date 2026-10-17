import type { ReactNode } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

export interface DashboardShellProps {
  children: ReactNode;
  /** "live" once the case stream has delivered a snapshot, "connecting" before, "offline" on error. */
  connection: "live" | "connecting" | "offline";
  /** e.g. "updated 12s ago" */
  updatedLabel: string | null;
  footer?: ReactNode;
}

/**
 * Console chrome: one slim bar with the way back, the brand, and an honest
 * live indicator (it only says "Live" when the stream is actually connected).
 */
export function DashboardShell({ children, connection, updatedLabel, footer }: DashboardShellProps) {
  return (
    <div className="min-h-dvh bg-ivory text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-ivory/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <BackLink />
            <Logo />
            <span aria-hidden="true" className="hidden h-5 w-px bg-line sm:block" />
            <span className="hidden text-sm font-medium text-ink-soft sm:block">Field desk</span>
          </div>

          <p className="flex items-center gap-2 text-sm font-medium text-ink-soft" aria-live="polite">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              {connection === "live" ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-60 motion-reduce:hidden" />
              ) : null}
              <span
                className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full",
                  connection === "live" ? "bg-forest-500" : connection === "offline" ? "bg-alert-500" : "bg-saffron",
                )}
              />
            </span>
            {connection === "live" ? "Live" : connection === "offline" ? "Offline" : "Connecting…"}
            {connection === "live" && updatedLabel ? (
              <span className="hidden text-muted sm:inline">· {updatedLabel}</span>
            ) : null}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-8 sm:pt-12">{children}</main>

      {footer ? (
        <footer className="mx-auto max-w-[1320px] px-4 text-xs text-muted sm:px-8">
          <div className="border-t border-line py-6">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
