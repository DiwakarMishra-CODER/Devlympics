"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getServices } from "@/lib/services";
import {
  cancelSpeech,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  primeVoices,
  speak,
  startListening,
  type RecognizerHandle,
} from "@/lib/speech";
import {
  anythingMoreLine,
  buildSms,
  caseContextFromCase,
  classifyYesNo,
  closingLine,
  createMessage,
  fallbackLine,
  followUpOpening,
  goAheadLine,
  greetingFor,
  networkErrorLine,
  normaliseTicket,
  responseToCreateInput,
  toChatHistory,
  toNewTurns,
} from "@/lib/phone/mappers";
import {
  CALL_RING_MS,
  DEMO_CALLER_LABEL,
  DEMO_NUMBER,
} from "@/lib/phone/demo";
import type {
  AppLanguage,
  AskMode,
  AskResponse,
  Case,
  CaseContext,
  ChatMessage,
  ConversationMessage,
  MessageRole,
  Ticket,
} from "@/lib/types";

export type PhoneScreen = "idle" | "call" | "ticket" | "lookup" | "ended";
export type CallPhase = "idle" | "dialing" | "ringing" | "in_call";
export type CallDirection = "outgoing" | "incoming";
export type TurnStatus = "idle" | "listening" | "processing" | "speaking" | "error";
export type TicketVariant = "new" | "saved";

/** A finished call, handed to the device so it can be listed in Recents. */
export interface EndedCallInfo {
  id: string;
  number: string;
  label: string;
  direction: CallDirection;
  at: string;
  durationMs: number;
  ticket: Ticket | null;
  missed: boolean;
}

/** Hard stop so a confused caller never loops forever. */
const MAX_USER_TURNS = 6;

/** IVR-style language menu played when a first call connects; each line in its own voice. */
const LANGUAGE_MENU: ReadonlyArray<{ text: string; lang: AppLanguage }> = [
  { text: "To continue in English, press 1.", lang: "en-IN" },
  { text: "हिंदी में बात करने के लिए 2 दबाइए।", lang: "hi-IN" },
];
const MENU_DIGITS: Readonly<Record<string, AppLanguage>> = { "1": "en-IN", "2": "hi-IN" };

let callSeq = 0;

export interface UsePhoneCall {
  screen: PhoneScreen;
  callPhase: CallPhase;
  direction: CallDirection;
  turnStatus: TurnStatus;
  language: AppLanguage;
  /** True while the first-call language menu is waiting for 1 or 2. */
  choosingLanguage: boolean;
  messages: readonly ConversationMessage[];
  liveTranscript: string;
  error: string | null;
  activeCase: Case | null;
  ticketVariant: TicketVariant;
  lookupBusy: boolean;
  lookupError: string | null;
  recognitionSupported: boolean;
  speechSupported: boolean;
  muted: boolean;
  speaker: boolean;
  elapsedMs: number;
  endedCall: EndedCallInfo | null;

  setLanguage: (language: AppLanguage) => void;
  startOutgoingCall: (number: string) => void;
  startFollowUp: (item: Case) => void;
  answer: () => void;
  chooseLanguage: (digit: string) => void;
  endCall: () => void;
  declineCall: () => void;
  listen: () => void;
  stopListening: () => void;
  retry: () => void;
  sendText: (text: string) => void;
  goIdle: () => void;
  goLookup: () => void;
  lookup: (raw: string) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  showTicket: () => void;
}

/**
 * Owns the whole simulated-call lifecycle so pages/components stay presentational.
 * Flow: idle → (dialing) → in_call (listen → process → speak, repeat) → ticket,
 * or → ended when the person hangs up.
 */
export function usePhoneCall(): UsePhoneCall {
  const [screen, setScreen] = useState<PhoneScreen>("idle");
  const [callPhase, setCallPhase] = useState<CallPhase>("idle");
  const [direction, setDirection] = useState<CallDirection>("outgoing");
  const [turnStatus, setTurnStatus] = useState<TurnStatus>("idle");
  const [language, setLanguageState] = useState<AppLanguage>("en-IN");
  const [choosingLanguage, setChoosingLanguage] = useState(false);
  const [messages, setMessages] = useState<readonly ConversationMessage[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [ticketVariant, setTicketVariant] = useState<TicketVariant>("new");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [endedCall, setEndedCall] = useState<EndedCallInfo | null>(null);

  const languageRef = useRef<AppLanguage>(language);
  const choosingRef = useRef(false);
  const screenRef = useRef<PhoneScreen>(screen);
  const callPhaseRef = useRef<CallPhase>(callPhase);
  const directionRef = useRef<CallDirection>(direction);
  const mutedRef = useRef(muted);
  const speakerRef = useRef(speaker);
  const modeRef = useRef<AskMode>("first_call");
  const chatRef = useRef<ChatMessage[]>([]);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const contextRef = useRef<CaseContext | null>(null);
  const ticketRef = useRef<Ticket | null>(null);
  const followUpCaseRef = useRef<Case | null>(null);
  const callNumberRef = useRef<string>(DEMO_NUMBER);
  const callLabelRef = useRef<string>(DEMO_CALLER_LABEL);
  const callStartRef = useRef<number | null>(null);
  const turnCountRef = useRef(0);
  const recognizerRef = useRef<RecognizerHandle | null>(null);
  const stopSpeakRef = useRef<(() => void) | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitRef = useRef<(text: string) => void>(() => undefined);
  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const pendingRingRef = useRef<Case | null>(null);
  /** Latest AI answer this call; a case is saved from it if the caller says "no more". */
  const lastResponseRef = useRef<AskResponse | null>(null);
  /** The case saved during this call (created once, then updated). */
  const savedCaseRef = useRef<Case | null>(null);
  /** How many transcript messages are already stored on the case. */
  const savedTurnsRef = useRef(0);
  /** True after "anything more?" was asked and we're waiting for yes/no. */
  const closingRef = useRef(false);
  const silenceRef = useRef<() => void>(() => undefined);
  const wrapUpRef = useRef<() => void>(() => undefined);

  // Capability detection only ever changes on a real client, so resolve it once.
  const recognitionSupported = useMemo(() => isSpeechRecognitionSupported(), []);
  const speechSupported = useMemo(() => isSpeechSynthesisSupported(), []);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    callPhaseRef.current = callPhase;
  }, [callPhase]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    speakerRef.current = speaker;
  }, [speaker]);

  useEffect(() => {
    // Re-assert liveness: React StrictMode mounts, unmounts, then remounts in
    // development, and the first cleanup sets this to false.
    aliveRef.current = true;
    primeVoices();
    return () => {
      aliveRef.current = false;
      recognizerRef.current?.abort();
      cancelSpeech();
      if (ringTimerRef.current !== null) clearTimeout(ringTimerRef.current);
    };
  }, []);

  // Connected-call timer.
  useEffect(() => {
    if (callPhase !== "in_call") {
      setElapsedMs(0);
      return;
    }
    const tick = (): void => {
      if (callStartRef.current !== null) {
        setElapsedMs(Date.now() - callStartRef.current);
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [callPhase]);

  const appendMessage = useCallback((role: MessageRole, text: string): void => {
    const message = createMessage(role, text);
    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
  }, []);

  const stopAllMedia = useCallback((): void => {
    recognizerRef.current?.abort();
    recognizerRef.current = null;
    stopSpeakRef.current?.();
    stopSpeakRef.current = null;
    cancelSpeech();
    if (ringTimerRef.current !== null) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const resetConversation = useCallback((): void => {
    stopAllMedia();
    messagesRef.current = [];
    setMessages([]);
    setLiveTranscript("");
    setError(null);
    chatRef.current = [];
    turnCountRef.current = 0;
    callStartRef.current = null;
    busyRef.current = false;
    choosingRef.current = false;
    setChoosingLanguage(false);
    lastResponseRef.current = null;
    savedCaseRef.current = null;
    savedTurnsRef.current = 0;
    closingRef.current = false;
    setElapsedMs(0);
  }, [stopAllMedia]);

  const recordEnded = useCallback(
    (overrides: {
      missed: boolean;
      ticket: Ticket | null;
      durationMs?: number;
    }): void => {
      callSeq += 1;
      setEndedCall({
        id: `call_${callSeq}`,
        number: callNumberRef.current,
        label: callLabelRef.current,
        direction: directionRef.current,
        at: new Date().toISOString(),
        durationMs:
          overrides.durationMs ??
          (callStartRef.current !== null ? Date.now() - callStartRef.current : 0),
        ticket: overrides.ticket,
        missed: overrides.missed,
      });
    },
    [],
  );

  const speakText = useCallback((text: string, lang: AppLanguage): Promise<void> => {
    if (!isSpeechSynthesisSupported()) return Promise.resolve();
    return new Promise<void>((resolve) => {
      setTurnStatus("speaking");
      stopSpeakRef.current = speak(
        text,
        lang,
        {
          onEnd: () => {
            stopSpeakRef.current = null;
            resolve();
          },
        },
        { volume: speakerRef.current ? 1 : 0.8 },
      );
    });
  }, []);

  const finishCall = useCallback(
    (item: Case, variant: TicketVariant): void => {
      stopAllMedia();
      busyRef.current = false;
      recordEnded({ missed: false, ticket: item.ticket });
      setActiveCase(item);
      setTicketVariant(variant);
      setCallPhase("idle");
      setTurnStatus("idle");
      setScreen("ticket");
    },
    [recordEnded, stopAllMedia],
  );

  const persistResponse = useCallback(
    async (response: AskResponse, lang: AppLanguage): Promise<Case> => {
      const services = getServices();
      const pending = messagesRef.current.slice(savedTurnsRef.current);
      const existing = savedCaseRef.current;
      let saved: Case;

      if (modeRef.current === "first_call" && !existing) {
        const input = responseToCreateInput(response, lang, messagesRef.current);
        const created = await services.createCase(input);
        saved = created.smsText.includes("#TICKET")
          ? await services.updateCase(created.ticket, { smsText: buildSms(created) })
          : created;
        savedTurnsRef.current = messagesRef.current.length;
        savedCaseRef.current = saved;
        return saved;
      }

      if (modeRef.current === "first_call" && existing) {
        // The caller kept talking after the case was opened: update it, don't open another.
        const input = responseToCreateInput(response, lang, []);
        saved = await services.updateCase(existing.ticket, {
          name: input.name ?? existing.name,
          district: input.district ?? existing.district,
          domain: input.domain,
          subject: input.subject ?? existing.subject,
          problem: input.problem,
          problemKey: input.problemKey,
          severity: input.severity,
          status: input.status,
          advice: input.advice,
          smsText: (input.smsText ?? "").replaceAll("#TICKET", existing.ticket),
          icons: input.icons,
          expertSummary: input.expertSummary ?? existing.expertSummary,
        });
      } else {
        const ticket = ticketRef.current;
        if (!ticket) throw new Error("Follow-up response without a ticket");
        if (response.resolved === true) {
          saved = await services.resolveFollowUp(ticket, { resolved: true });
        } else if (response.resolved === false) {
          saved = await services.resolveFollowUp(ticket, {
            resolved: false,
            expertSummary: response.expertSummary,
          });
        } else {
          saved = await services.escalateCase(ticket, response.expertSummary ?? undefined);
        }
      }

      if (pending.length) await services.appendTurns(saved.ticket, toNewTurns(pending));
      savedTurnsRef.current = messagesRef.current.length;
      savedCaseRef.current = saved;
      return saved;
    },
    [],
  );

  const beginListening = useCallback((): void => {
    if (busyRef.current || choosingRef.current) return;
    if (callPhaseRef.current !== "in_call") return;
    if (mutedRef.current) return;

    const lang = languageRef.current;

    if (!isSpeechRecognitionSupported()) {
      setTurnStatus("error");
      setError("Voice input is not available here. Type your message below.");
      return;
    }

    setError(null);
    setLiveTranscript("");
    setTurnStatus("listening");

    let collected = "";
    let handled = false;

    const handle = startListening(
      lang,
      {
        onResult: (result) => {
          collected = result.transcript;
          setLiveTranscript(result.transcript);
        },
        onError: (code) => {
          if (code === "aborted") return;
          handled = true;
          if (code === "no-speech" && lastResponseRef.current) {
            silenceRef.current();
            return;
          }
          setTurnStatus("error");
          setError(
            code === "not-allowed"
              ? "Microphone permission was denied. You can type your message below."
              : code === "no-speech"
                ? fallbackLine(lang)
                : networkErrorLine(lang),
          );
        },
        onEnd: () => {
          recognizerRef.current = null;
          if (handled) return;
          const text = collected.trim();
          if (!text && lastResponseRef.current) {
            silenceRef.current();
            return;
          }
          if (!text) {
            setTurnStatus("error");
            setError(fallbackLine(lang));
            return;
          }
          submitRef.current(text);
        },
      },
      { silenceMs: 7000 },
    );

    recognizerRef.current = handle;
  }, []);

  const applyLanguage = useCallback((next: AppLanguage): void => {
    languageRef.current = next;
    setLanguageState(next);
  }, []);

  /** Greets in the current language, then starts listening. */
  const openConversation = useCallback((): void => {
    const lang = languageRef.current;
    const item = followUpCaseRef.current;
    const opening =
      modeRef.current === "follow_up" && item
        ? followUpOpening(lang, item)
        : greetingFor(lang);

    appendMessage("saathi", opening);

    void speakText(opening, lang).then(() => {
      if (!aliveRef.current) return;
      if (callPhaseRef.current !== "in_call") return;
      beginListening();
    });
  }, [appendMessage, beginListening, speakText]);

  const answer = useCallback((): void => {
    if (ringTimerRef.current !== null) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    callStartRef.current = Date.now();
    setCallPhase("in_call");
    callPhaseRef.current = "in_call";
    setError(null);

    // Follow-ups continue in the language the case was opened in.
    const item = followUpCaseRef.current;
    if (modeRef.current === "follow_up" && item) {
      applyLanguage(item.language);
      openConversation();
      return;
    }

    // First calls ask for a language before anything else.
    choosingRef.current = true;
    setChoosingLanguage(true);
    void (async () => {
      for (const line of LANGUAGE_MENU) {
        if (!aliveRef.current || !choosingRef.current) return;
        await speakText(line.text, line.lang);
      }
      if (aliveRef.current && choosingRef.current) setTurnStatus("idle");
    })();
  }, [applyLanguage, openConversation, speakText]);

  const chooseLanguage = useCallback(
    (digit: string): void => {
      const next = MENU_DIGITS[digit];
      if (!choosingRef.current || !next) return;
      choosingRef.current = false;
      setChoosingLanguage(false);
      // Cut the menu short if they pressed before it finished.
      stopSpeakRef.current?.();
      stopSpeakRef.current = null;
      cancelSpeech();
      applyLanguage(next);
      openConversation();
    },
    [applyLanguage, openConversation],
  );

  const submitUtterance = useCallback(
    async (raw: string): Promise<void> => {
      const text = raw.trim();
      if (!text || busyRef.current || choosingRef.current) return;
      if (callPhaseRef.current !== "in_call") return;

      const lang = languageRef.current;

      if (closingRef.current) {
        closingRef.current = false;
        const verdict = classifyYesNo(text);
        if (verdict === "no") {
          appendMessage("user", text);
          wrapUpRef.current();
          return;
        }
        if (verdict === "yes") {
          appendMessage("user", text);
          const line = goAheadLine(lang);
          appendMessage("saathi", line);
          await speakText(line, lang);
          if (aliveRef.current) beginListening();
          return;
        }
        // Anything else is a new question: carry on with it.
      }

      busyRef.current = true;

      appendMessage("user", text);
      setLiveTranscript("");
      setTurnStatus("processing");
      setError(null);

      chatRef.current = [...chatRef.current, { role: "user", content: text }];
      turnCountRef.current += 1;

      let response: AskResponse | null = null;
      try {
        response = await getServices().askSaathi({
          mode: modeRef.current,
          language: lang,
          history: toChatHistory(messagesRef.current),
          caseContext: contextRef.current,
        });
      } catch {
        response = null;
      }

      if (!aliveRef.current) {
        busyRef.current = false;
        return;
      }

      if (!response) {
        busyRef.current = false;
        setTurnStatus("error");
        setError(networkErrorLine(lang));
        return;
      }

      appendMessage("saathi", response.reply);
      chatRef.current = [...chatRef.current, { role: "assistant", content: response.reply }];
      lastResponseRef.current = response;

      const safetyStop = turnCountRef.current >= MAX_USER_TURNS;
      const done = response.done || safetyStop;

      let created: Case | null = null;
      if (done) {
        try {
          created = await persistResponse(response, lang);
        } catch {
          created = null;
        }
        if (!aliveRef.current) {
          busyRef.current = false;
          return;
        }
        if (!created) {
          busyRef.current = false;
          setTurnStatus("error");
          setError(networkErrorLine(lang));
          return;
        }
      }

      busyRef.current = false;
      await speakText(response.reply, lang);
      if (!aliveRef.current) return;

      // A saved case doesn't end the call: it stays open until the caller has nothing more.
      if (safetyStop) {
        wrapUpRef.current();
        return;
      }

      beginListening();
    },
    [appendMessage, beginListening, persistResponse, speakText],
  );

  useEffect(() => {
    submitRef.current = (text: string) => {
      void submitUtterance(text);
    };
  }, [submitUtterance]);

  const startOutgoingCall = useCallback(
    (number: string): void => {
      resetConversation();
      modeRef.current = "first_call";
      contextRef.current = null;
      ticketRef.current = null;
      followUpCaseRef.current = null;
      callNumberRef.current = number;
      callLabelRef.current = DEMO_CALLER_LABEL;
      setActiveCase(null);
      setMuted(false);
      setSpeaker(false);
      setDirection("outgoing");
      setScreen("call");
      setCallPhase("dialing");
      setTurnStatus("idle");

      if (ringTimerRef.current !== null) clearTimeout(ringTimerRef.current);
      ringTimerRef.current = setTimeout(() => {
        ringTimerRef.current = null;
        if (!aliveRef.current) return;
        answer();
      }, CALL_RING_MS);
    },
    [answer, resetConversation],
  );

  const startFollowUp = useCallback(
    (item: Case): void => {
      resetConversation();
      modeRef.current = "follow_up";
      contextRef.current = caseContextFromCase(item);
      ticketRef.current = item.ticket;
      followUpCaseRef.current = item;
      callNumberRef.current = DEMO_NUMBER;
      callLabelRef.current = DEMO_CALLER_LABEL;
      setActiveCase(item);
      setMuted(false);
      setSpeaker(false);
      setDirection("incoming");
      setScreen("call");
      setCallPhase("ringing");
      setTurnStatus("idle");
    },
    [resetConversation],
  );

  const endCall = useCallback((): void => {
    stopAllMedia();
    busyRef.current = false;
    choosingRef.current = false;
    setChoosingLanguage(false);
    recordEnded({ missed: false, ticket: activeCase ? activeCase.ticket : null });
    setCallPhase("idle");
    setTurnStatus("idle");
    setLiveTranscript("");
    setError(null);
    messagesRef.current = [];
    setMessages([]);
    setMuted(false);
    setSpeaker(false);
    setScreen("ended");
  }, [activeCase, recordEnded, stopAllMedia]);

  /** Caller said "no more" (or stayed silent twice): save, read the ticket out twice, end. */
  const wrapUp = useCallback(async (): Promise<void> => {
    if (busyRef.current) return;
    busyRef.current = true;
    closingRef.current = false;
    recognizerRef.current?.abort();
    recognizerRef.current = null;
    setTurnStatus("processing");
    const lang = languageRef.current;

    let item = savedCaseRef.current;
    try {
      if (lastResponseRef.current && (!item || savedTurnsRef.current < messagesRef.current.length)) {
        item = await persistResponse(lastResponseRef.current, lang);
      }
    } catch {
      // Keep whatever was saved earlier; the ticket still exists.
    }
    if (!aliveRef.current) return;
    busyRef.current = false;

    if (!item) {
      endCall();
      return;
    }

    const line = closingLine(item.ticket, lang);
    appendMessage("saathi", line);
    await speakText(line, lang);
    if (!aliveRef.current || callPhaseRef.current !== "in_call") return;
    finishCall(item, modeRef.current === "first_call" ? "new" : "saved");
  }, [appendMessage, endCall, finishCall, persistResponse, speakText]);

  /** Caller went quiet after an answer: ask once, then wrap up on a second silence. */
  const handleSilence = useCallback((): void => {
    if (closingRef.current) {
      void wrapUp();
      return;
    }
    closingRef.current = true;
    const lang = languageRef.current;
    const line = anythingMoreLine(lang);
    appendMessage("saathi", line);
    void speakText(line, lang).then(() => {
      if (!aliveRef.current || callPhaseRef.current !== "in_call") return;
      beginListening();
    });
  }, [appendMessage, beginListening, speakText, wrapUp]);

  useEffect(() => {
    silenceRef.current = handleSilence;
    wrapUpRef.current = () => {
      void wrapUp();
    };
  }, [handleSilence, wrapUp]);

  const declineCall = useCallback((): void => {
    stopAllMedia();
    busyRef.current = false;
    choosingRef.current = false;
    setChoosingLanguage(false);
    recordEnded({ missed: true, ticket: null, durationMs: 0 });
    setCallPhase("idle");
    setTurnStatus("idle");
    setLiveTranscript("");
    setError(null);
    messagesRef.current = [];
    setMessages([]);
    setMuted(false);
    setSpeaker(false);
    setScreen("idle");
  }, [recordEnded, stopAllMedia]);

  const listen = useCallback((): void => {
    setError(null);
    setTurnStatus("idle");
    beginListening();
  }, [beginListening]);

  const stopListening = useCallback((): void => {
    recognizerRef.current?.stop();
  }, []);

  const retry = listen;

  const sendText = useCallback(
    (text: string): void => {
      setError(null);
      void submitUtterance(text);
    },
    [submitUtterance],
  );

  const goIdle = useCallback((): void => {
    stopAllMedia();
    resetConversation();
    setActiveCase(null);
    setTicketVariant("new");
    setCallPhase("idle");
    setTurnStatus("idle");
    setMuted(false);
    setSpeaker(false);
    setScreen("idle");
  }, [resetConversation, stopAllMedia]);

  const goLookup = useCallback((): void => {
    stopAllMedia();
    setLookupError(null);
    setLookupBusy(false);
    setScreen("lookup");
  }, [stopAllMedia]);

  const showTicket = useCallback((): void => {
    if (activeCase) {
      setScreen("ticket");
    } else {
      goIdle();
    }
  }, [activeCase, goIdle]);

  const lookup = useCallback((raw: string): void => {
    const result = normaliseTicket(raw);
    if ("message" in result) {
      setLookupError(result.message);
      return;
    }
    setLookupBusy(true);
    setLookupError(null);
    void getServices()
      .lookupTicket(result.ticket)
      .then((found) => {
        if (!aliveRef.current) return;
        setLookupBusy(false);
        if (!found) {
          setLookupError(`Ticket ${result.ticket} was not found. Please try again.`);
          return;
        }
        setActiveCase(found);
        setTicketVariant("saved");
        setScreen("ticket");
      })
      .catch(() => {
        if (!aliveRef.current) return;
        setLookupBusy(false);
        setLookupError("Could not check just now. Please try again in a moment.");
      });
  }, []);

  const toggleMute = useCallback((): void => {
    setMuted((current) => {
      const next = !current;
      if (next) {
        // Muting stops any in-progress capture immediately.
        recognizerRef.current?.abort();
        recognizerRef.current = null;
        if (turnStatus === "listening") setTurnStatus("idle");
      }
      return next;
    });
  }, [turnStatus]);

  const toggleSpeaker = useCallback((): void => {
    setSpeaker((current) => !current);
  }, []);

  const setLanguage = useCallback((next: AppLanguage): void => {
    languageRef.current = next;
    setLanguageState(next);
  }, []);

  /**
   * Watches the case stream for a follow-up the expert has triggered
   * (`ringNow`). When the phone is idle we answer it ourselves: clear the flag,
   * then run the follow-up call. One subscription, cleaned up on unmount.
   */
  const maybeRing = useCallback((): void => {
    const pending = pendingRingRef.current;
    if (!pending || !aliveRef.current) return;
    if (screenRef.current !== "idle" || callPhaseRef.current !== "idle") return;

    pendingRingRef.current = null;
    void getServices()
      .clearRing(pending.ticket)
      .catch(() => undefined)
      .finally(() => {
        if (aliveRef.current) startFollowUp(pending);
      });
  }, [startFollowUp]);

  useEffect(() => {
    const unsubscribe = getServices().listenCases((next) => {
      if (!aliveRef.current) return;
      pendingRingRef.current = next.find((item) => item.ringNow) ?? null;
      maybeRing();
    });
    return unsubscribe;
  }, [maybeRing]);

  useEffect(() => {
    maybeRing();
  }, [screen, callPhase, maybeRing]);

  return useMemo(
    () => ({
      screen,
      callPhase,
      direction,
      turnStatus,
      language,
      choosingLanguage,
      messages,
      liveTranscript,
      error,
      activeCase,
      ticketVariant,
      lookupBusy,
      lookupError,
      recognitionSupported,
      speechSupported,
      muted,
      speaker,
      elapsedMs,
      endedCall,
      setLanguage,
      startOutgoingCall,
      startFollowUp,
      answer,
      chooseLanguage,
      endCall,
      declineCall,
      listen,
      stopListening,
      retry,
      sendText,
      goIdle,
      goLookup,
      lookup,
      toggleMute,
      toggleSpeaker,
      showTicket,
    }),
    [
      screen,
      callPhase,
      direction,
      turnStatus,
      language,
      choosingLanguage,
      messages,
      liveTranscript,
      error,
      activeCase,
      ticketVariant,
      lookupBusy,
      lookupError,
      recognitionSupported,
      speechSupported,
      muted,
      speaker,
      elapsedMs,
      endedCall,
      setLanguage,
      startOutgoingCall,
      startFollowUp,
      answer,
      chooseLanguage,
      endCall,
      declineCall,
      listen,
      stopListening,
      retry,
      sendText,
      goIdle,
      goLookup,
      lookup,
      toggleMute,
      toggleSpeaker,
      showTicket,
    ],
  );
}
