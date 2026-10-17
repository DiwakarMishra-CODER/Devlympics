"use client";

import { useState, type FormEvent } from "react";
import { Keyboard, Phone, PhoneOff, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CallHeader } from "./CallHeader";
import { CallControls } from "./CallControls";
import { CallTranscript } from "../CallTranscript";
import { MicButton } from "../MicButton";
import { Keypad } from "../Keypad";
import { formatDuration, formatPhoneNumber } from "@/lib/phone/demo";
import type { AppLanguage, ConversationMessage } from "@/lib/types";
import type { CallPhase, TurnStatus } from "@/hooks/usePhoneCall";

export interface CallScreenProps {
  callPhase: CallPhase;
  turnStatus: TurnStatus;
  messages: readonly ConversationMessage[];
  liveTranscript: string;
  language: AppLanguage;
  /** First-call language menu is waiting for 1 (English) or 2 (Hindi). */
  choosingLanguage: boolean;
  error: string | null;
  recognitionSupported: boolean;
  speaker: boolean;
  muted: boolean;
  elapsedMs: number;
  label: string;
  number: string;
  onEnd: () => void;
  onChooseLanguage: (digit: string) => void;
  onListen: () => void;
  onStopListening: () => void;
  onRetry: () => void;
  onSendText: (text: string) => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

/**
 * The active call: a short "calling" state while a placed call connects, then
 * the live conversation with one dominant mic action and always-reachable end.
 */
export function CallScreen({
  callPhase,
  turnStatus,
  messages,
  liveTranscript,
  language,
  choosingLanguage,
  error,
  recognitionSupported,
  speaker,
  muted,
  elapsedMs,
  label,
  number,
  onEnd,
  onChooseLanguage,
  onListen,
  onStopListening,
  onRetry,
  onSendText,
  onToggleMute,
  onToggleSpeaker,
}: CallScreenProps) {
  const [draft, setDraft] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const typingAvailable = !recognitionSupported || turnStatus === "error" || showTyping;
  const pretty = formatPhoneNumber(number);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    onSendText(value);
  };

  if (callPhase === "dialing") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center bg-forest-900 px-6 pb-8 pt-12 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
          Calling…
        </p>

        <div className="relative mt-8 grid place-items-center">
          <span
            aria-hidden="true"
            className="absolute h-28 w-28 rounded-full bg-forest-500/40 animate-pulse-ring motion-reduce:animate-none"
          />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-saffron text-forest-900 shadow-lift">
            <Phone className="h-10 w-10" strokeWidth={1.6} aria-hidden="true" />
          </span>
        </div>

        <h1 className="mt-8 font-display text-3xl font-semibold">{label}</h1>
        <p className="mt-1.5 text-sm text-white/70">{pretty}</p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80">
          Connecting your call…
        </p>

        <div className="mt-auto flex flex-col items-center gap-2 pt-10">
          <button
            type="button"
            onClick={onEnd}
            aria-label="End call"
            className="focus-ring grid h-16 w-16 place-items-center rounded-full bg-alert-500 text-white shadow-lift transition-colors hover:bg-alert-600"
          >
            <PhoneOff className="h-6 w-6" aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold text-white/80">End</span>
        </div>
      </div>
    );
  }

  if (choosingLanguage) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-ivory">
        <CallHeader label={label} number={pretty} status={`In call · ${formatDuration(elapsedMs)}`} />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-2xl border border-line bg-white p-4 text-center shadow-soft">
            <p className="text-base font-semibold text-forest-900">To continue in English, press 1</p>
            <p className="mt-1.5 text-base font-semibold text-forest-900">हिंदी में बात करने के लिए 2 दबाइए</p>
          </div>
          <Keypad className="mt-5" language="en-IN" onDigit={onChooseLanguage} onBackspace={() => undefined} />
        </div>

        <div className="shrink-0 border-t border-line bg-ivory px-5 pb-5 pt-4">
          <CallControls
            muted={muted}
            speaker={speaker}
            onToggleMute={onToggleMute}
            onToggleSpeaker={onToggleSpeaker}
            onEnd={onEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ivory">
      <CallHeader label={label} number={pretty} status={`In call · ${formatDuration(elapsedMs)}`} />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <CallTranscript
          messages={messages}
          liveTranscript={liveTranscript}
          turnStatus={turnStatus}
          language={language}
        />

        {error ? (
          <div className="mt-4 rounded-2xl border border-alert-100 bg-alert-50 p-3.5">
            <p className="text-sm font-medium leading-relaxed text-alert-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-alert-700"
            >
              <Icon icon={RotateCcw} size="sm" />
              Try again
            </button>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line bg-ivory px-5 pb-5 pt-4">
        {typingAvailable ? (
          <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type here…"
              aria-label="Type your message"
              className="focus-ring h-14 flex-1 rounded-2xl border border-line bg-white px-4 text-base text-ink placeholder:text-muted"
            />
            <Button type="submit" variant="primary" size="lg" disabled={!draft.trim()}>
              <Icon icon={Send} size="md" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowTyping(true)}
            className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700"
          >
            <Icon icon={Keyboard} size="sm" />
            Type instead
          </button>
        )}

        <div className="flex flex-col items-center gap-4">
          <MicButton
            status={turnStatus}
            language={language}
            disabled={!recognitionSupported || muted}
            onPress={turnStatus === "listening" ? onStopListening : onListen}
          />

          <CallControls
            muted={muted}
            speaker={speaker}
            onToggleMute={onToggleMute}
            onToggleSpeaker={onToggleSpeaker}
            onEnd={onEnd}
          />
        </div>

        <p className="mt-3 text-center text-[0.7rem] leading-snug text-muted">
          This is a demo conversation — no real call or SMS is sent.
        </p>
      </div>
    </div>
  );
}
