"use client";

import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CallControlsProps {
  muted: boolean;
  speaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEnd: () => void;
  className?: string;
}

interface ControlButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ControlButton({ active, label, onClick, children }: ControlButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          "focus-ring grid h-14 w-14 place-items-center rounded-full border transition-colors",
          active
            ? "border-forest bg-forest text-ivory"
            : "border-line bg-white text-forest-700 hover:bg-ivory-50",
        )}
      >
        {children}
      </button>
      <span className="text-[0.68rem] font-semibold text-muted">{label}</span>
    </div>
  );
}

/** In-call actions: mute, end, speaker. */
export function CallControls({
  muted,
  speaker,
  onToggleMute,
  onToggleSpeaker,
  onEnd,
  className,
}: CallControlsProps) {
  return (
    <div className={cn("flex items-start justify-center gap-6", className)}>
      <ControlButton active={muted} label="Mute" onClick={onToggleMute}>
        {muted ? (
          <MicOff className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Mic className="h-5 w-5" aria-hidden="true" />
        )}
      </ControlButton>

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onEnd}
          aria-label="End call"
          className="focus-ring grid h-16 w-16 place-items-center rounded-full bg-alert-500 text-white shadow-lift transition-colors hover:bg-alert-600"
        >
          <PhoneOff className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="text-[0.68rem] font-semibold text-muted">End</span>
      </div>

      <ControlButton active={speaker} label="Speaker" onClick={onToggleSpeaker}>
        {speaker ? (
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        ) : (
          <VolumeX className="h-5 w-5" aria-hidden="true" />
        )}
      </ControlButton>
    </div>
  );
}
