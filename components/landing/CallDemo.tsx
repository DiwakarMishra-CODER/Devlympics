"use client";

import { useEffect, useState } from "react";
import { Phone, RotateCcw } from "lucide-react";

const lines: ReadonlyArray<{ from: "saathi" | "you"; text: string }> = [
  { from: "saathi", text: "Hello! I'm Saathi. What's the problem?" },
  { from: "you", text: "My tomato leaves are turning yellow." },
  { from: "saathi", text: "Okay. Don't spray anything for 2 days. Water the plants in the morning." },
  { from: "saathi", text: "I'll call you in 3 days to check. Your case number is 4721." },
];

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

/**
 * A button phone that plays a short pretend call. It starts on its own and
 * can be replayed. With reduced motion the whole call shows at once.
 */
export function CallDemo() {
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = lines.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), reduce ? 0 : 900 + i * 1500),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [run]);

  const done = shown >= lines.length;

  return (
    <div className="relative grid items-end gap-6 sm:grid-cols-[auto_1fr] lg:block">
      {/* The phone */}
      <div
        className="relative mx-auto w-56 -rotate-3 rounded-[2.25rem] border-[3px] border-forest-900 bg-forest-800 p-3.5 pb-5 shadow-hard lg:absolute lg:-left-4 lg:top-0 lg:w-60"
        aria-hidden="true"
      >
        <div className="rounded-2xl border-2 border-forest-900 bg-[#CFE3C6] p-3 font-code text-forest-900">
          <div className="flex justify-between text-[0.6rem] font-semibold">
            <span>▂▄▆</span>
            <span>10:42</span>
          </div>
          <p className="mt-3 text-center text-[0.6rem] uppercase tracking-[0.25em]">
            {done ? "On call" : "Calling"}
          </p>
          <p className="text-center font-grotesk text-xl font-bold">SAATHI</p>
          <p className="text-center text-xs">1800-XXX-XXXX</p>
        </div>
        <div className="mt-3 flex justify-between px-1">
          <span className="h-5 w-10 rounded-full bg-[#3DAA5C]" />
          <span className="h-5 w-10 rounded-full bg-alert-500" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {keys.map((k) => (
            <span
              key={k}
              className="grid h-8 place-items-center rounded-lg bg-forest-700 font-code text-xs font-semibold text-ivory/90"
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* The conversation */}
      <div className="lg:ml-[17.5rem] lg:pt-6">
        <ol className="min-h-[19rem] space-y-3" aria-live="polite">
          {lines.slice(0, shown).map((l, i) => (
            <li
              key={`${run}-${i}`}
              className={`w-fit max-w-[19rem] animate-bubble-in border-2 border-forest-900 px-4 py-3 text-[1.05rem] font-medium leading-snug shadow-hard-sm ${
                l.from === "saathi"
                  ? "rounded-2xl rounded-bl-none bg-white text-ink"
                  : "ml-auto rounded-2xl rounded-br-none bg-saffron text-forest-900"
              }`}
            >
              <span className="mb-1 block font-code text-[0.65rem] font-semibold uppercase tracking-[0.18em] opacity-60">
                {l.from === "saathi" ? "Saathi" : "You"}
              </span>
              {l.text}
            </li>
          ))}
          {!done ? (
            <li className="flex w-fit gap-1 rounded-full border-2 border-forest-900 bg-white px-4 py-3" aria-hidden="true">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-pulse rounded-full bg-forest-900"
                  style={{ animationDelay: `${d * 0.2}s` }}
                />
              ))}
            </li>
          ) : null}
        </ol>
        <button
          type="button"
          onClick={() => {
            setShown(0);
            setRun((r) => r + 1);
          }}
          className={`focus-ring mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-forest-900 bg-ivory px-4 font-code text-xs font-semibold uppercase tracking-[0.14em] text-forest-900 transition-[opacity,transform] duration-200 hover:-translate-y-0.5 ${
            done ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {done ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Phone className="h-4 w-4" aria-hidden="true" />}
          Play the call again
        </button>
      </div>
    </div>
  );
}
