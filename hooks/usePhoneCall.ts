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
  buildSms,
  caseContextFromCase,
  createMessage,
  fallbackLine,
  followUpOpening,
  greetingFor,
  networkErrorLine,
  normaliseTicket,
  responseToCreateInput,
  ticketSpeech,
  toChatHistory,
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

let callSeq = 0;

export interface UsePhoneCall {
  screen: PhoneScreen;
  callPhase: CallPhase;
  direction: CallDirection;
  turnStatus: TurnStatus;
  language: AppLanguage;
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
      if (variant === "new" && isSpeechSynthesisSupported()) {
        stopSpeakRef.current = speak(ticketSpeech(item.ticket, languageRef.current), languageRef.current, {
          onEnd: () => {
            stopSpeakRef.current = null;
          },
        });
      }
    },
    [recordEnded, stopAllMedia],
  );

  const persistResponse = useCallback(
    async (response: AskResponse, lang: AppLanguage): Promise<Case> => {
      const services = getServices();

      if (modeRef.current === "first_call") {
        const input = responseToCreateInput(response, lang, messagesRef.current);
        const created = await services.createCase(input);
        if (created.smsText.includes("#TICKET")) {
          return services.updateCase(created.ticket, { smsText: buildSms(created) });
        }
        return created;
      }

      const ticket = ticketRef.current;
      if (!ticket) throw new Error("Follow-up response without a ticket");
      if (response.resolved === true) {
        return services.resolveFollowUp(ticket, { resolved: true });
      }
      if (response.resolved === false) {
        return services.resolveFollowUp(ticket, {
          resolved: false,
          expertSummary: response.expertSummary,
        });
      }
      return services.escalateCase(ticket, response.expertSummary ?? undefined);
    },
    [],
  );

  const beginListening = useCallback((): void => {
    if (busyRef.current) return;
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
          if (!text) {
            setTurnStatus("error");
            setError(fallbackLine(lang));
            return;
          }
          submitRef.current(text);
        },
      },
      { silenceMs: 8000 },
    );

    recognizerRef.current = handle;
  }, []);

  const answer = useCallback((): void => {
    if (ringTimerRef.current !== null) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    callStartRef.current = Date.now();
    setCallPhase("in_call");
    callPhaseRef.current = "in_call";
    setError(null);

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

  const submitUtterance = useCallback(
    async (raw: string): Promise<void> => {
      const text = raw.trim();
      if (!text || busyRef.current) return;
      if (callPhaseRef.current !== "in_call") return;

      const lang = languageRef.current;
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

      if (created) {
        finishCall(created, "new");
        return;
      }

      beginListening();
    },
    [appendMessage, beginListening, finishCall, persistResponse, speakText],
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

  const declineCall = useCallback((): void => {
    stopAllMedia();
    busyRef.current = false;
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
