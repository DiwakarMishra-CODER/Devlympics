/**
 * Demo telephone configuration for the simulated phone experience.
 *
 * There is no real telephony here: only one number (the Saathi demo line) can
 * be "called". Any other number is treated as an unavailable external call so
 * the demo never silently pretends to dial out, and never dials a real
 * emergency shortcode.
 */

/** The one callable number (kept non-emergency and clearly fake). */
export const DEMO_NUMBER = "9000000000";
/** Pretty form used in copy. */
export const DEMO_NUMBER_DISPLAY = "+91 90000 00000";
/** Caller label shown for the demo line. */
export const DEMO_CALLER_LABEL = "Saathi";
/** How long a placed call "rings" before it is answered. */
export const CALL_RING_MS = 1800;
/** Minimum digits before a number is considered dialable at all. */
const MIN_DIAL_DIGITS = 3;

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

export function isSampleNumber(value: string): boolean {
  return digitsOnly(value) === DEMO_NUMBER;
}

/** Loose plausibility check — enough to reject empty/garbage input. */
export function isPlausibleNumber(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= MIN_DIAL_DIGITS && digits.length <= 15;
}

/** Turns a stored number into something readable, leaving odd input as-is. */
export function formatPhoneNumber(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return value;
}

/** "1:05" / "0:07" for call timers and recents. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export interface DemoContact {
  id: string;
  name: string;
  number: string;
  note: string;
  callable: boolean;
}

/** A short, believable address book. Only the Saathi line is callable. */
export const DEMO_CONTACTS: readonly DemoContact[] = [
  {
    id: "saathi",
    name: "Saathi",
    number: DEMO_NUMBER,
    note: "AI case worker",
    callable: true,
  },
  {
    id: "kvk",
    name: "KVK Meerut",
    number: "0121000042",
    note: "Farm advisory",
    callable: false,
  },
  {
    id: "block",
    name: "Block office",
    number: "0522000017",
    note: "Pension & schemes",
    callable: false,
  },
  {
    id: "asha",
    name: "ASHA worker",
    number: "9876543210",
    note: "Health",
    callable: false,
  },
];
