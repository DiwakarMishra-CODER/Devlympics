import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";
import { cn } from "@/lib/cn";

export interface DeviceFrameProps {
  children: ReactNode;
  /** Status-bar text colour: "light" over dark/wallpaper, "dark" over light. */
  statusTone?: "light" | "dark";
  className?: string;
}

/**
 * The person's side is rendered inside a warm device frame so it reads as a
 * phone experience on a laptop/projector, and goes edge-to-edge on a real
 * handset. Visually distinct from the light expert console.
 */
export function DeviceFrame({ children, statusTone = "light", className }: DeviceFrameProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-forest-900 sm:px-4 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 hidden h-96 w-96 rounded-full bg-forest-500/30 blur-3xl sm:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 hidden h-96 w-96 rounded-full bg-saffron/10 blur-3xl sm:block"
      />

      <div className={cn("relative w-full max-w-[420px]", className)}>
        <div className="bg-transparent p-0 sm:rounded-[2.75rem] sm:border sm:border-white/10 sm:bg-forest-800 sm:p-2.5 sm:shadow-phone">
          <div
            className={cn(
              "relative flex h-dvh flex-col overflow-hidden sm:h-[780px] sm:max-h-[84dvh] sm:min-h-[600px] sm:rounded-[2.25rem]",
              statusTone === "light" ? "bg-forest-900" : "bg-ivory",
            )}
          >
            <StatusBar tone={statusTone} />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
