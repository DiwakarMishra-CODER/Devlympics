"use client";

import { useInView } from "./useInView";

const COLS = 18;
const ROWS = 9;

// Fixed, hand-placed so the picture is the same on every render.
const scattered = new Set([3, 11, 22, 30, 41, 47, 66, 88, 104, 115, 121, 133, 142, 150, 159]);
// Nine calls bunched together, matching the warning card.
const cluster = new Set([57, 58, 59, 75, 76, 77, 93, 94, 95]);

/**
 * A district as a grid of dots. Calls light up across the map, then one
 * corner turns red: many calls, same problem, same place.
 */
export function AlertGrid() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <div ref={ref} className="relative rounded-[1.75rem] border-[3px] border-forest-900 bg-white p-5 shadow-hard sm:p-7">
      <div className="flex items-center justify-between font-code text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span>Sehore district · this week</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-forest-400" /> 1 call
        </span>
      </div>

      <div
        className="mt-5 grid gap-[5px] sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const hot = cluster.has(i);
          const lit = scattered.has(i);
          return (
            <span
              key={i}
              className={`aspect-square rounded-full transition-all duration-500 ${
                inView && hot
                  ? "scale-125 bg-alert-500"
                  : inView && lit
                    ? "bg-forest-400"
                    : "bg-forest-900/10"
              }`}
              style={{ transitionDelay: inView ? `${hot ? 1400 + (i % 7) * 90 : (i % 13) * 60}ms` : "0ms" }}
            />
          );
        })}
      </div>

      <div
        className={`relative mt-5 max-w-[15rem] -rotate-2 sm:absolute sm:right-8 sm:top-1/2 sm:mt-0 sm:max-w-[13rem] rounded-2xl border-[3px] border-forest-900 bg-alert-500 p-4 text-white shadow-hard transition-all duration-500 ${
          inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: inView ? "2.3s" : "0ms" }}
      >
        <p className="font-code text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/80">Warning</p>
        <p className="mt-1 font-grotesk text-lg font-bold leading-tight">9 calls about yellow tomato leaves</p>
      </div>

      <p className="sr-only">
        Example: nine calls about yellow tomato leaves from one part of Sehore district in one week raise a warning.
      </p>
    </div>
  );
}
