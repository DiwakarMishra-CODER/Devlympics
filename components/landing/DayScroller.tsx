"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface DayStep {
  day: string;
  title: string;
  body: string;
  visual: ReactNode;
}

/**
 * Sticky "Step 1 → Step 4" counter on the left; steps scroll past on the
 * right. On small screens the numbered titles carry the order.
 */
export function DayScroller({ steps }: { steps: readonly DayStep[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const current = steps[active];

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <p className="font-code text-sm font-semibold uppercase tracking-[0.2em] text-forest-900/60">You are at</p>
          <p
            key={current?.day}
            className="mt-2 animate-fade-up font-grotesk text-[9rem] font-bold leading-[0.85] tracking-[-0.04em] text-forest-900"
          >
            {current?.day}
          </p>
          <div className="mt-10 flex gap-2">
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={`h-2 flex-1 rounded-full border-2 border-forest-900 transition-colors duration-300 ${
                  i <= active ? "bg-forest-900" : "bg-transparent"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 font-code text-xs font-semibold uppercase tracking-[0.18em] text-forest-900/60">
            {current?.title}
          </p>
        </div>
      </div>

      <ol className="space-y-6 lg:space-y-[28vh] lg:py-[12vh]">
        {steps.map((s, i) => (
          <li
            key={s.title}
            ref={(node) => {
              refs.current[i] = node;
            }}
            data-index={i}
            className={`rounded-[1.75rem] border-[3px] border-forest-900 bg-ivory p-6 shadow-hard transition-opacity duration-500 sm:p-8 ${
              i === active ? "lg:opacity-100" : "lg:opacity-40"
            }`}
          >
            <div className="flex min-h-36 items-center justify-center rounded-2xl bg-white p-5">{s.visual}</div>
            <h3 className="mt-6 font-grotesk text-3xl font-bold tracking-[-0.02em] text-forest-900 sm:text-4xl">
              <span className="mr-3 text-saffron-600">{i + 1}.</span>
              {s.title}
            </h3>
            <p className="mt-2 text-lg leading-relaxed text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
