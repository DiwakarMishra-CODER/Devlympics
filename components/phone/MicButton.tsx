"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { AppLanguage } from "@/lib/types";
import type { TurnStatus } from "@/hooks/usePhoneCall";
import { cn } from "@/lib/cn";

export interface MicButtonProps {
  status: TurnStatus;
  language: AppLanguage;
  disabled?: boolean;
  onPress: () => void;
  className?: string;
}

/**
 * The single dominant action while in a call. Large target (>= 88px), with
 * unmistakable recording / thinking / speaking states.
 */
export function MicButton({
  status,
  language,
  disabled = false,
  onPress,
  className,
}: MicButtonProps) {
  const listening = status === "listening";
  const busy = status === "processing" || status === "speaking";
  const inactive = disabled || busy;

  const label = listening
    ? language === "hi-IN"
      ? "सुन रहा हूँ… टैप करके रोकें"
      : "Listening… tap to stop"
    : status === "processing"
      ? language === "hi-IN"
        ? "साथी सोच रहा है…"
        : "Saathi is thinking…"
      : status === "speaking"
        ? language === "hi-IN"
          ? "साथी बोल रहा है…"
          : "Saathi is speaking…"
        : language === "hi-IN"
          ? "बोलने के लिए टैप करें"
          : "Tap to speak";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        {listening ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-alert-500/40 animate-pulse-ring"
          />
        ) : null}
        <button
          type="button"
          onClick={onPress}
          disabled={inactive}
          aria-label={label}
          aria-pressed={listening}
          className={cn(
            "focus-ring relative grid h-24 w-24 place-items-center rounded-full text-ivory shadow-lift transition-colors disabled:opacity-60",
            listening ? "bg-alert-500" : "bg-forest hover:bg-forest-600",
          )}
        >
          {busy ? (
            <Spinner className="h-8 w-8 text-ivory" />
          ) : (
            <span className="grid place-items-center">
              <Icon icon={listening ? MicOff : status === "error" ? MicOff : Mic} size="xl" />
            </span>
          )}
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-center text-sm font-semibold text-forest-700">
        {status === "speaking" ? <Icon icon={Volume2} size="sm" /> : null}
        {label}
      </p>
    </div>
  );
}
