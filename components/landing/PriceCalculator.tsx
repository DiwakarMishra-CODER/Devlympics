"use client";

import { useId, useState } from "react";
import { CALL_CENTRE_PER_CALL, billedMinutes, discountedMonthly, inr, quoteB2B } from "@/lib/pricing";

/** Set call length and calls per month; see the bill, the plan it lands on, and a call-centre bill. */
export function PriceCalculator() {
  const lengthId = useId();
  const callsId = useId();
  const [callMinutes, setCallMinutes] = useState(3);
  const [calls, setCalls] = useState(4_000);

  const perCall = billedMinutes(callMinutes);
  const minutes = calls * perCall;
  const quote = quoteB2B(minutes);
  const discounted = discountedMonthly(minutes);
  const callCentre = calls * CALL_CENTRE_PER_CALL;
  const saved = Math.max(0, callCentre - discounted);

  return (
    <div className="rounded-[1.75rem] border-[3px] border-forest-900 bg-white p-6 shadow-hard sm:p-8">
      <p className="font-grotesk text-2xl font-bold tracking-[-0.02em] text-forest-900">What will it cost you?</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={lengthId} className="font-code text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            One call lasts
          </label>
          <p className="mt-1 font-grotesk text-4xl font-bold tracking-[-0.04em] text-forest-900 tabular-nums">
            {callMinutes} min
          </p>
          <input
            id={lengthId}
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={callMinutes}
            onChange={(e) => setCallMinutes(Number(e.target.value))}
            className="mt-3 h-11 w-full cursor-pointer accent-forest-900"
          />
          <p className="text-sm text-muted">Billed as {perCall} full {perCall === 1 ? "minute" : "minutes"}</p>
        </div>

        <div>
          <label htmlFor={callsId} className="font-code text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Calls a month
          </label>
          <p className="mt-1 font-grotesk text-4xl font-bold tracking-[-0.04em] text-forest-900 tabular-nums">
            {calls.toLocaleString("en-IN")}
          </p>
          <input
            id={callsId}
            type="range"
            min={100}
            max={60_000}
            step={100}
            value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="mt-3 h-11 w-full cursor-pointer accent-forest-900"
          />
          <p className="text-sm text-muted">{minutes.toLocaleString("en-IN")} minutes in total</p>
        </div>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-ivory-200 p-4">
          <dt className="font-code text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Per minute</dt>
          <dd className="mt-1 font-grotesk text-2xl font-bold tabular-nums text-forest-900">{inr(quote.monthly)}</dd>
          <dd className="text-xs text-muted">a month</dd>
        </div>
        <div className="rounded-2xl bg-forest-900 p-4 text-ivory">
          <dt className="font-code text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory/60">Monthly · 5% off</dt>
          <dd className="mt-1 font-grotesk text-2xl font-bold tabular-nums">{inr(discounted)}</dd>
          <dd className="text-xs text-ivory/70">a month</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-2xl border-2 border-dashed border-forest-900/40 p-4 text-sm text-ink-soft">
        A call centre would spend about <strong className="text-forest-900">{inr(callCentre)}</strong> a month on the
        same calls. On the monthly plan you save <strong className="text-forest-900">{inr(saved)}</strong>.
      </p>
      <p className="mt-4 text-sm text-muted">
        Monthly price, GST extra. Each call is rounded up to a full minute, the way our voice partner Sarvam bills it.
        Call-centre cost is our estimate.
      </p>
    </div>
  );
}
