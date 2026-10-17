/**
 * Thin, defensive wrapper around the browser speech APIs.
 *
 * Browsers expose speech recognition behind vendor prefixes and only on
 * `https`/`localhost`, and `speechSynthesis` voices load asynchronously. This
 * module hides all of that and — critically — guarantees that the caller is
 * always told when recognition stops, so the UI can never get stuck in a
 * "listening" state.
 */

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

export interface RecognizerHandlers {
  onResult: (result: SpeechResult) => void;
  /** Called exactly once when recognition stops for any reason. */
  onEnd: () => void;
  onError: (code: SpeechErrorCode) => void;
}

export type SpeechErrorCode =
  | "unsupported"
  | "not-allowed"
  | "no-speech"
  | "network"
  | "aborted"
  | "unknown";

export interface RecognizerHandle {
  stop: () => void;
  abort: () => void;
}

export interface SpeakHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export interface SpeakOptions {
  /** 0–1 output volume. Defaults to 1. */
  volume?: number;
}

// ---- Minimal ambient types (not in lib.dom for all targets) ----------

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  item: (index: number) => SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  item: (index: number) => SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike | undefined;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function mapSpeechError(code: string): SpeechErrorCode {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    case "aborted":
      return "aborted";
    default:
      return "unknown";
  }
}

/**
 * Starts one recognition session. Returns `null` when unsupported (the caller
 * should fall back to text input). Recognition auto-stops on the first final
 * result or after `silenceMs` of quiet, and `handlers.onEnd` always fires.
 */
export function startListening(
  language: string,
  handlers: RecognizerHandlers,
  options: { silenceMs?: number } = {},
): RecognizerHandle | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    handlers.onError("unsupported");
    handlers.onEnd();
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let settled = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  const silenceMs = options.silenceMs ?? 8000;

  const clearSilence = (): void => {
    if (silenceTimer !== null) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const finish = (): void => {
    if (settled) return;
    settled = true;
    clearSilence();
    handlers.onEnd();
  };

  const armSilence = (): void => {
    clearSilence();
    silenceTimer = setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        finish();
      }
    }, silenceMs);
  };

  recognition.onresult = (event) => {
    armSilence();
    const result = event.results[event.results.length - 1];
    if (!result) return;
    const alternative = result[0];
    if (!alternative) return;
    const transcript = alternative.transcript;
    if (!transcript) return;
    handlers.onResult({ transcript, isFinal: result.isFinal });
    if (result.isFinal) {
      try {
        recognition.stop();
      } catch {
        finish();
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error !== "aborted") {
      handlers.onError(mapSpeechError(event.error));
    }
    finish();
  };

  recognition.onend = () => {
    finish();
  };

  try {
    recognition.start();
    armSilence();
  } catch {
    handlers.onError("unknown");
    finish();
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        finish();
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      finish();
    },
  };
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speakSafetyTimer: ReturnType<typeof setTimeout> | null = null;

export function cancelSpeech(): void {
  if (speakSafetyTimer !== null) {
    clearTimeout(speakSafetyTimer);
    speakSafetyTimer = null;
  }
  activeUtterance = null;
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

function pickVoice(language: string): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefix = language.slice(0, 2).toLowerCase();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase()) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

/**
 * Speaks `text` and resolves via callbacks. `onEnd` is guaranteed to fire even
 * if the browser never emits `end` (a safety timer based on text length covers
 * that), so the conversation can always advance.
 */
export function speak(
  text: string,
  language: string,
  handlers: SpeakHandlers = {},
  options: SpeakOptions = {},
): () => void {
  if (!text.trim() || !isSpeechSynthesisSupported()) {
    handlers.onEnd?.();
    return () => undefined;
  }

  cancelSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  const voice = pickVoice(language);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = Math.min(1, Math.max(0, options.volume ?? 1));

  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    if (speakSafetyTimer !== null) {
      clearTimeout(speakSafetyTimer);
      speakSafetyTimer = null;
    }
    if (activeUtterance === utterance) activeUtterance = null;
    handlers.onEnd?.();
  };

  utterance.onstart = () => {
    handlers.onStart?.();
  };
  utterance.onend = () => finish();
  utterance.onerror = () => {
    handlers.onError?.();
    finish();
  };

  activeUtterance = utterance;
  speakSafetyTimer = setTimeout(finish, Math.min(20000, 2500 + text.length * 90));

  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    handlers.onError?.();
    finish();
  }

  return () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    finish();
  };
}

/** Voice list often populates asynchronously; this warms it up once. */
export function primeVoices(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}
