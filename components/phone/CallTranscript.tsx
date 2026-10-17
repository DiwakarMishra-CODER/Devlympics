"use client";

import { Bot, User } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { AppLanguage, ConversationMessage } from "@/lib/types";
import type { TurnStatus } from "@/hooks/usePhoneCall";
import { cn } from "@/lib/cn";

export interface CallTranscriptProps {
  messages: readonly ConversationMessage[];
  liveTranscript: string;
  turnStatus: TurnStatus;
  language: AppLanguage;
  className?: string;
}

/**
 * Two clearly different bubble styles: Saathi (forest) vs the caller (white),
 * plus an interim "listening" bubble so the person sees their words forming.
 */
export function CallTranscript({
  messages,
  liveTranscript,
  turnStatus,
  language,
  className,
}: CallTranscriptProps) {
  const listening = turnStatus === "listening";
  const processing = turnStatus === "processing";

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      aria-live="polite"
      aria-label={language === "hi-IN" ? "बातचीत" : "Conversation"}
    >
      {messages.map((message) => {
        const isSaathi = message.role === "saathi";
        return (
          <div
            key={message.id}
            className={cn("flex items-end gap-2", isSaathi ? "justify-start" : "justify-end")}
          >
            {isSaathi ? (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-ivory">
                <Icon icon={Bot} size="sm" />
              </span>
            ) : null}
            <p
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[0.95rem] leading-relaxed [overflow-wrap:anywhere]",
                isSaathi
                  ? "rounded-bl-sm bg-forest text-ivory"
                  : "rounded-br-sm border border-line bg-white text-ink",
              )}
            >
              {message.text}
            </p>
            {isSaathi ? null : (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage-200 text-forest-700">
                <Icon icon={User} size="sm" />
              </span>
            )}
          </div>
        );
      })}

      {listening ? (
        <div className="flex items-end justify-end gap-2">
          <p className="max-w-[82%] rounded-2xl rounded-br-sm border border-dashed border-forest-300 bg-white/70 px-3.5 py-2.5 text-[0.95rem] italic text-muted [overflow-wrap:anywhere]">
            {liveTranscript ||
              (language === "hi-IN" ? "बोलिए, मैं सुन रहा हूँ…" : "Speak, I am listening…")}
          </p>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage-200 text-forest-700">
            <Icon icon={User} size="sm" />
          </span>
        </div>
      ) : null}

      {processing ? (
        <div className="flex items-center gap-2 pl-9">
          <Spinner label={language === "hi-IN" ? "साथी सोच रहा है" : "Saathi is thinking"} />
          <span className="text-sm text-muted">
            {language === "hi-IN" ? "साथी सोच रहा है…" : "Saathi is thinking…"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
