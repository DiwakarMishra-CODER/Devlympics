import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";

export type DataMode = "live" | "demo" | "empty";

const modeConfig: Record<DataMode, { tone: BadgeTone; label: string }> = {
  live: { tone: "sage", label: "Live" },
  demo: { tone: "saffron", label: "Demo data" },
  empty: { tone: "neutral", label: "No data" },
};

export interface DashboardShellProps {
  children: ReactNode;
  dataMode?: DataMode;
}

/**
 * Desktop console chrome: a light, dense frame for the projector. Shares the
 * Saathi brand (logo, saffron accent) but is deliberately distinct from the
 * dark phone experience.
 */
export function DashboardShell({ children, dataMode = "empty" }: DashboardShellProps) {
  const mode = modeConfig[dataMode];

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span
              aria-hidden="true"
              className="hidden h-6 w-px bg-line sm:block"
            />
            <span className="hidden text-sm font-medium text-muted sm:block">
              Expert console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={mode.tone} dot>
              {mode.label}
            </Badge>
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted md:inline-flex">
              <ShieldCheck
                className="h-3.5 w-3.5 text-forest-600"
                aria-hidden="true"
              />
              KVK Meerut
            </span>
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-forest text-xs font-semibold text-ivory"
            >
              KV
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="mx-auto max-w-screen-2xl px-4 pb-8 text-xs text-muted sm:px-6 lg:px-8">
        <p>
          Sample rows are labelled <span className="font-semibold text-saffron-700">Demo</span> and
          are written only by <span className="font-mono">seedDemoData()</span>; clearing them never
          touches live cases. Metrics and alerts are computed from the live case stream on this
          page.
        </p>
      </footer>
    </div>
  );
}
