/**
 * Saathi pricing, built up from what one minute of a call really costs us.
 *
 * Voice runs on Sarvam Voice Agents (formerly Samvaad). Rates from
 * https://docs.sarvam.ai/voice-agents/pricing (checked 17 Oct 2026, INR, excl. GST):
 *   agent: ₹3.50/min pay-as-you-go, ₹3.25 Pro, ₹3.15 Growth, ₹3.00 Business
 *   telephony: ₹0.20 per 30-second pulse = ₹0.40/min
 *   agent minutes are billed in whole 60-second pulses (a 45 s call = 1 min)
 */

export const SARVAM = {
  agentPerMin: { payg: 3.5, pro: 3.25, growth: 3.15, business: 3.0 },
  telephonyPerMin: 0.4,
} as const;

/** SMS ticket, database, backup AI and support, spread per minute (our estimate). */
export const OVERHEAD_PER_MIN = 0.35;

/** A typical problem: first call ~3 min + 3-day follow-up ~1.5 min, billed as 3 + 2 whole minutes. */
export const BILLED_MIN_PER_PROBLEM = 5;

export const GST = 0.18;

/** Our cost for one billed minute on a given Sarvam plan (excl. GST). */
export function costPerMinute(plan: keyof typeof SARVAM.agentPerMin): number {
  return SARVAM.agentPerMin[plan] + SARVAM.telephonyPerMin + OVERHEAD_PER_MIN;
}

/**
 * The one number every price is built from: ₹3.90 per billed minute, excl. GST
 * (Sarvam Growth ₹3.15 + phone line ₹0.40 + SMS/cloud ₹0.35).
 */
export const COST_PER_MIN = 3.9;

/** What everyone pays per minute: exactly our cost. No monthly fee, no margin. */
export const PRICE_PER_MIN = COST_PER_MIN;

/** COST_PER_MIN with GST, i.e. what a minute costs when sold to a person. */
export const COST_PER_MIN_WITH_GST = Math.round(COST_PER_MIN * (1 + GST) * 100) / 100;

/** Sarvam bills whole minutes per call. */
export function billedMinutes(callMinutes: number): number {
  return Math.max(1, Math.ceil(callMinutes));
}

export interface B2CPlan {
  name: string;
  hindi: string;
  /** Price paid, GST included (how Indian recharge packs are sold). */
  price: number;
  minutes: number;
  validity: string;
  problems: string;
  points: string[];
  featured?: boolean;
}

/** For people and families: free minutes every month, then ₹3.90 a minute. Packs are just minutes × ₹3.90. */
export const B2C_PLANS: readonly B2CPlan[] = [
  {
    name: "Free",
    hindi: "मुफ़्त",
    price: 0,
    minutes: 10,
    validity: "every month",
    problems: "about 2 problems",
    points: ["Calls + the 3-day call back", "Ticket number by SMS", "Paid for by partner offices"],
  },
  {
    name: "5 minutes",
    hindi: "5 मिनट",
    price: 5 * PRICE_PER_MIN,
    minutes: 5,
    validity: "28 days",
    problems: "1 full problem",
    points: ["Call + 3-day call back", "Any button phone works", "Recharge at any shop or UPI"],
    featured: true,
  },
  {
    name: "10 minutes",
    hindi: "10 मिनट",
    price: 10 * PRICE_PER_MIN,
    minutes: 10,
    validity: "28 days",
    problems: "about 2 problems",
    points: ["Whole family on one number", "Hindi and English", "Same ₹3.90 a minute"],
  },
];

export const B2C_EXTRA_PER_MIN = PRICE_PER_MIN;

/** Kept for existing imports: same as COST_PER_MIN_WITH_GST. */
export const REAL_COST_PER_MIN_WITH_GST = COST_PER_MIN_WITH_GST;

export type Billing = "minute" | "month";

export interface B2BPlan {
  name: string;
  billing: Billing;
  forWho: string;
  /** Minutes bought per month (null for pay-per-minute). */
  minutesPerMonth: number | null;
  /** Discount on ₹3.90 a minute: 5% on monthly. */
  discount: number;
  parallelCalls: string;
  points: string[];
  badge?: string;
  featured?: boolean;
}

export const MONTHLY_DISCOUNT = 0.05;

/** For offices: the same ₹3.90 minute, paid per minute or monthly (5% off). */
export const B2B_PLANS: readonly B2BPlan[] = [
  {
    name: "Pay per minute",
    billing: "minute",
    forWho: "Try it out, or for small groups and NGOs",
    minutesPerMonth: null,
    discount: 0,
    parallelCalls: "3 calls at once",
    points: ["No commitment, stop any time", "Your own phone number", "Live case screen"],
  },
  {
    name: "Monthly",
    billing: "month",
    forWho: "District office or KVK",
    minutesPerMonth: 2_500,
    discount: MONTHLY_DISCOUNT,
    parallelCalls: "20 calls at once",
    points: ["Early warnings when trouble spreads", "Hard cases sent to your experts", "Extra minutes at the same discount"],
    badge: "Most picked",
    featured: true,
  },
];

/** Price of one minute on a plan, after its discount (excl. GST). */
export function planPerMinute(plan: B2BPlan): number {
  return PRICE_PER_MIN * (1 - plan.discount);
}

/** What you pay: ₹3.90 for pay-per-minute, or the monthly bill. */
export function planPrice(plan: B2BPlan): number {
  if (plan.minutesPerMonth === null) return PRICE_PER_MIN;
  return Math.round(plan.minutesPerMonth * planPerMinute(plan) * 100) / 100;
}

/** Minutes included each month (null for pay-per-minute). */
export function planMinutes(plan: B2BPlan): number | null {
  return plan.minutesPerMonth;
}

/** About what a person answering phones costs per call (salary, seat, phone line). Our estimate. */
export const CALL_CENTRE_PER_CALL = 38;

export interface Quote {
  plan: B2BPlan;
  monthly: number;
}

/** State pricing starts at this many minutes a month. */
export const STATE_MIN_MINUTES = 100_000;

/** A month of usage paid per minute (the calculator compares it with the monthly plan). */
export function quoteB2B(minutes: number): Quote {
  const plan = B2B_PLANS.find((p) => p.billing === "minute")!;
  return { plan, monthly: minutes * PRICE_PER_MIN };
}

/** Same usage on the monthly plan's 5% discount. */
export function discountedMonthly(minutes: number): number {
  return minutes * PRICE_PER_MIN * (1 - MONTHLY_DISCOUNT);
}

export const inr = (n: number, digits = 0): string =>
  "₹" + (n + Math.sign(n) * 1e-9).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
