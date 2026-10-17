"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { usePhoneCall } from "@/hooks/usePhoneCall";
import { FeaturePhone, type PhoneKey } from "@/components/phone/feature/FeaturePhone";
import { CallTranscript } from "@/components/phone/CallTranscript";
import { BackLink } from "@/components/ui/BackLink";
import { iconSpec } from "@/lib/icons";
import {
  DEMO_NUMBER,
  DEMO_NUMBER_DISPLAY,

  formatDuration,
  isSampleNumber,
} from "@/lib/phone/demo";
import type { AppLanguage } from "@/lib/types";

const MAX_DIAL_DIGITS = 13;

function useClock(): string {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = (): void => setNow(new Date());
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!now) return "--:--";
  return now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function statusLine(status: string, language: AppLanguage, muted: boolean): string {
  const hi = language === "hi-IN";
  if (muted) return hi ? "म्यूट है" : "Muted";
  switch (status) {
    case "listening":
      return hi ? "बोलिए… सुन रहा हूँ" : "Speak… listening";
    case "processing":
      return hi ? "साथी सोच रहा है…" : "Saathi is thinking…";
    case "speaking":
      return hi ? "साथी बोल रहा है…" : "Saathi is speaking…";
    case "error":
      return hi ? "OK दबाकर फिर बोलें" : "Press OK to speak again";
    default:
      return hi ? "OK दबाकर बोलें" : "Press OK to speak";
  }
}

/** Small centred block used by most LCD screens. */
function Lcd({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">{children}</div>;
}

export function KeypadPhoneView() {
  const call = usePhoneCall();
  const time = useClock();
  const [dialed, setDialed] = useState("");
  const [lookupDigits, setLookupDigits] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  const inCall = call.screen === "call" && call.callPhase === "in_call";
  const lang = call.language;

  const goHome = useCallback((): void => {
    setDialed("");
    setLookupDigits("");
    call.goIdle();
  }, [call]);

  const placeCall = useCallback((): void => {
    if (dialed && !isSampleNumber(dialed)) {
      setNotice("Number not reachable");
      return;
    }
    setDialed("");
    call.startOutgoingCall(DEMO_NUMBER);
  }, [call, dialed]);

  const onKey = useCallback(
    (key: PhoneKey): void => {
      const isDigit = /^[0-9]$/.test(key);

      if (call.screen === "idle") {
        if (isDigit || key === "*" || key === "#") {
          setDialed((d) => (d.length < MAX_DIAL_DIGITS ? d + key : d));
        } else if (key === "call" || key === "ok") {
          placeCall();
        } else if (key === "softRight") {
          if (dialed) setDialed((d) => d.slice(0, -1));
          else call.startOutgoingCall(DEMO_NUMBER);
        } else if (key === "softLeft") {
          setLookupDigits("");
          call.goLookup();
        } else if (key === "end") {
          setDialed("");
        }
        return;
      }

      if (call.screen === "call") {
        if (call.callPhase === "ringing") {
          if (key === "call" || key === "softLeft" || key === "ok") call.answer();
          else if (key === "end" || key === "softRight") call.declineCall();
          return;
        }
        if (key === "end") {
          call.endCall();
          return;
        }
        if (!inCall) return;
        if (call.choosingLanguage) {
          if (isDigit) call.chooseLanguage(key);
          return;
        }
        if (key === "softLeft") call.toggleMute();
        else if (key === "softRight") call.toggleSpeaker();
        else if ((key === "ok" || key === "call") && (call.turnStatus === "idle" || call.turnStatus === "error")) {
          call.listen();
        }
        return;
      }

      if (call.screen === "lookup") {
        if (isDigit) {
          setLookupDigits((d) => (d.length < 4 ? d + key : d));
        } else if (key === "call" || key === "ok") {
          call.lookup(lookupDigits);
        } else if (key === "softRight") {
          if (lookupDigits) setLookupDigits((d) => d.slice(0, -1));
          else goHome();
        } else if (key === "end" || key === "softLeft") {
          goHome();
        }
        return;
      }

      if (call.screen === "ticket") {
        if (key === "softLeft" && call.activeCase && call.activeCase.status !== "resolved") {
          call.startFollowUp(call.activeCase);
        } else if (key === "end" || key === "softRight" || key === "ok") {
          goHome();
        }
        return;
      }

      if (call.screen === "ended") {
        if (key === "softLeft" && call.activeCase) call.showTicket();
        else if (key === "end" || key === "softRight" || key === "ok") goHome();
      }
    },
    [call, dialed, goHome, inCall, lookupDigits, placeCall],
  );

  // ---- LCD content + soft-key labels for the current state ------------
  let screen: ReactNode;
  let softLeft: string | undefined;
  let softRight: string | undefined;
  let okLabel: string | undefined;

  if (call.screen === "idle") {
    softLeft = "Ticket";
    softRight = dialed ? "Clear" : "Saathi";
    screen = dialed ? (
      <Lcd>
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-forest-900/60">Dial</p>
        <p className="mt-1 break-all font-mono text-2xl font-bold tabular-nums">{dialed}</p>
        <p className="mt-3 text-[0.7rem] text-forest-900/70">Press the green key to call</p>
      </Lcd>
    ) : (
      <Lcd>
        <p className="font-mono text-4xl font-bold tabular-nums">{time}</p>
        <p className="mt-1 text-xs font-semibold">Saathi Network</p>
        <p className="mt-4 text-[0.7rem] leading-snug text-forest-900/75">
          Dial <span className="font-mono font-bold">{DEMO_NUMBER_DISPLAY}</span>
          <br />
          or press the green key
        </p>
      </Lcd>
    );
  } else if (call.screen === "call" && call.callPhase === "dialing") {
    screen = (
      <Lcd>
        <p className="animate-pulse text-xs font-semibold uppercase tracking-wider">Calling…</p>
        <p className="mt-2 text-2xl font-bold">Saathi</p>
        <p className="mt-1 font-mono text-xs">{DEMO_NUMBER_DISPLAY}</p>
      </Lcd>
    );
  } else if (call.screen === "call" && call.callPhase === "ringing") {
    softLeft = "Answer";
    softRight = "Reject";
    screen = (
      <Lcd>
        <p className="animate-pulse text-xs font-semibold uppercase tracking-wider">Incoming call</p>
        <p className="mt-2 text-2xl font-bold">Saathi</p>
        <p className="mt-1 text-[0.7rem]">Follow-up for ticket #{call.activeCase?.ticket}</p>
      </Lcd>
    );
  } else if (inCall && call.choosingLanguage) {
    screen = (
      <Lcd>
        <p className="text-[0.7rem] font-semibold">Saathi · {formatDuration(call.elapsedMs)}</p>
        <div className="mt-3 w-full space-y-2 text-left text-sm font-semibold">
          <p className="rounded-md bg-forest-900/10 px-2 py-1.5">1 · English</p>
          <p className="rounded-md bg-forest-900/10 px-2 py-1.5">2 · हिंदी</p>
        </div>
        <p className="mt-3 text-[0.65rem] leading-snug text-forest-900/70">Press 1 or 2 · 1 या 2 दबाइए</p>
      </Lcd>
    );
  } else if (inCall) {
    const lastSaathi = [...call.messages].reverse().find((m) => m.role === "saathi");
    softLeft = call.muted ? "Unmute" : "Mute";
    softRight = call.speaker ? "Handset" : "Speaker";
    okLabel = call.turnStatus === "idle" || call.turnStatus === "error" ? "Speak" : undefined;
    screen = (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between text-[0.7rem] font-semibold">
          <span>Saathi</span>
          <span className="font-mono tabular-nums">{formatDuration(call.elapsedMs)}</span>
        </div>
        <p className="mt-1 rounded bg-forest-900 px-1.5 py-0.5 text-center text-[0.65rem] font-semibold text-[#e9efe1]">
          {statusLine(call.turnStatus, lang, call.muted)}
        </p>
        <p className="mt-2 line-clamp-5 text-[0.8rem] leading-snug">{lastSaathi?.text ?? ""}</p>
        {call.liveTranscript ? (
          <p className="mt-auto line-clamp-2 text-[0.7rem] italic text-forest-900/70">“{call.liveTranscript}”</p>
        ) : null}
      </div>
    );
  } else if (call.screen === "ticket" && call.activeCase) {
    const item = call.activeCase;
    softLeft = item.status !== "resolved" ? "Follow-up" : undefined;
    softRight = "Home";
    screen = (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-center text-[0.65rem] font-semibold uppercase tracking-wider text-forest-900/60">
          {call.ticketVariant === "new" ? "Your ticket" : "Ticket"}
        </p>
        <p className="text-center font-mono text-4xl font-bold tracking-[0.2em]">{item.ticket}</p>
        <p className="mt-1 text-center text-base" aria-label="Advice icons">
          {item.icons.map((key) => iconSpec(key).emoji).join(" ")}
        </p>
        <div className="mt-1.5 min-h-0 flex-1 overflow-hidden rounded-md border border-forest-900/20 bg-white/50 p-1.5">
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-forest-900/60">1 new message</p>
          <p className="line-clamp-4 text-[0.72rem] leading-snug">{item.smsText}</p>
        </div>
      </div>
    );
  } else if (call.screen === "ended") {
    softLeft = call.activeCase ? "Ticket" : undefined;
    softRight = "Home";
    screen = (
      <Lcd>
        <p className="text-lg font-bold">Call ended</p>
        <p className="mt-1 font-mono text-sm tabular-nums">{formatDuration(call.endedCall?.durationMs ?? 0)}</p>
      </Lcd>
    );
  } else if (call.screen === "lookup") {
    softLeft = "Back";
    softRight = lookupDigits ? "Clear" : "Back";
    okLabel = "Find";
    screen = (
      <Lcd>
        <p className="text-xs font-semibold">Enter ticket number</p>
        <div className="mt-3 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="grid h-10 w-8 place-items-center rounded-md border-2 border-forest-900/40 font-mono text-xl font-bold"
            >
              {lookupDigits[i] ?? ""}
            </span>
          ))}
        </div>
        <p className="mt-3 min-h-[2rem] text-[0.7rem] leading-snug text-alert-700">
          {call.lookupBusy ? "Searching…" : (call.lookupError ?? "")}
        </p>
      </Lcd>
    );
  } else {
    screen = <Lcd>{null}</Lcd>;
  }

  if (notice && call.screen === "idle") {
    screen = (
      <Lcd>
        <p className="text-sm font-bold">{notice}</p>
      </Lcd>
    );
  }

  const handleSend = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    call.sendText(value);
  };
  const showTyping = inCall && !call.choosingLanguage && (!call.recognitionSupported || call.turnStatus === "error");

  return (
    <div className="relative min-h-dvh bg-forest-900 px-4 py-10">
      <BackLink href="/phone" label="Switch phone" tone="light" className="absolute left-4 top-4 z-10" />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 lg:flex-row lg:items-start">
        <FeaturePhone softLeft={softLeft} softRight={softRight} okLabel={okLabel} time={time} onKey={onKey}>
          {screen}
        </FeaturePhone>

        {/* Live transcript for the audience; a keypad phone's screen is too small to show it all. */}
        <aside className="hidden w-full max-w-md flex-col rounded-3xl border border-white/10 bg-ivory p-5 lg:flex lg:h-[640px]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Live transcript</h2>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {call.messages.length || call.liveTranscript ? (
              <CallTranscript
                messages={call.messages}
                liveTranscript={call.liveTranscript}
                turnStatus={call.turnStatus}
                language={lang}
              />
            ) : (
              <p className="text-sm text-muted">
                Dial {DEMO_NUMBER_DISPLAY} or press the green key. Keyboard works too: digits, Enter = call,
                Esc = end, Backspace = clear.
              </p>
            )}
          </div>
          {call.error && inCall ? <p className="mt-3 text-sm font-medium text-alert-700">{call.error}</p> : null}
          {showTyping ? (
            <form onSubmit={handleSend} className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type instead…"
                aria-label="Type your message"
                className="focus-ring h-11 flex-1 rounded-xl border border-line bg-white px-3 text-sm"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="focus-ring rounded-xl bg-forest px-4 text-sm font-semibold text-ivory disabled:opacity-50"
              >
                Send
              </button>
            </form>
          ) : null}
        </aside>
      </div>
      <p className="mt-6 text-center text-xs text-white/50">
        Demo phone: no real call or SMS is sent.
      </p>
    </div>
  );
}
