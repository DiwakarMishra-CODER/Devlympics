"use client";

import { useEffect, type ReactNode } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/cn";

export type PhoneKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#"
  | "call" | "end" | "softLeft" | "softRight" | "ok" | "up" | "down" | "left" | "right";

export interface FeaturePhoneProps {
  /** Content of the small LCD, between the status bar and the soft-key labels. */
  children: ReactNode;
  softLeft?: string;
  softRight?: string;
  /** Optional label for the centre OK key, shown between the soft keys. */
  okLabel?: string;
  time: string;
  onKey: (key: PhoneKey) => void;
}

const KEYPAD: ReadonlyArray<{ key: PhoneKey; sub: string }> = [
  { key: "1", sub: "∞" }, { key: "2", sub: "abc" }, { key: "3", sub: "def" },
  { key: "4", sub: "ghi" }, { key: "5", sub: "jkl" }, { key: "6", sub: "mno" },
  { key: "7", sub: "pqrs" }, { key: "8", sub: "tuv" }, { key: "9", sub: "wxyz" },
  { key: "*", sub: "+" }, { key: "0", sub: "␣" }, { key: "#", sub: "⇧" },
];

/** Laptop keyboard → phone keys, so the demo can be driven without clicking. */
const KEYBOARD: Readonly<Record<string, PhoneKey>> = {
  Enter: "call",
  Escape: "end",
  Backspace: "softRight",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  "*": "*",
  "#": "#",
};

const keyBase =
  "focus-ring select-none transition-[transform,background-color] duration-75 active:translate-y-px";

/**
 * A classic keypad (feature) phone: small backlit LCD on top, soft keys, a
 * D-pad, green call / red end keys, and a 12-key number pad. Purely
 * presentational — every press is reported through `onKey`.
 */
export function FeaturePhone({ children, softLeft, softRight, okLabel, time, onKey }: FeaturePhoneProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const mapped = /^[0-9]$/.test(event.key) ? (event.key as PhoneKey) : KEYBOARD[event.key];
      if (!mapped) return;
      event.preventDefault();
      onKey(mapped);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKey]);

  return (
    <div className="w-[300px] max-w-full rounded-[3rem] border border-white/10 bg-gradient-to-b from-[#2b2f2d] via-[#1d201f] to-[#151716] px-5 pb-8 pt-5 shadow-phone">
      {/* Earpiece + brand */}
      <div className="flex flex-col items-center gap-2">
        <span aria-hidden="true" className="h-1.5 w-16 rounded-full bg-black/60 shadow-inner" />
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-white/40">Saathi</span>
      </div>

      {/* LCD */}
      <div className="mt-3 rounded-2xl bg-black/70 p-2 shadow-inner">
        <div className="flex h-[236px] flex-col overflow-hidden rounded-lg bg-[#e9efe1] text-forest-900">
          <div className="flex items-center justify-between px-2.5 pt-1.5 text-[0.65rem] font-semibold">
            <span className="flex items-end gap-[2px]" aria-label="Signal">
              {[3, 5, 7, 9].map((h) => (
                <span key={h} className="w-[3px] rounded-sm bg-forest-900" style={{ height: h }} />
              ))}
            </span>
            <span className="font-mono tabular-nums">{time}</span>
            <span aria-label="Battery" className="flex items-center gap-[1px]">
              <span className="flex h-2.5 w-5 items-center rounded-[2px] border border-forest-900 p-[1px]">
                <span className="h-full w-3/4 rounded-[1px] bg-forest-900" />
              </span>
              <span className="h-1 w-[2px] rounded-r-sm bg-forest-900" />
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3 py-1.5">{children}</div>

          <div className="flex items-center justify-between border-t border-forest-900/15 px-2.5 py-1 text-[0.7rem] font-bold">
            <span className="min-w-0 truncate">{softLeft ?? ""}</span>
            <span className="min-w-0 truncate text-forest-900/70">{okLabel ?? ""}</span>
            <span className="min-w-0 truncate text-right">{softRight ?? ""}</span>
          </div>
        </div>
      </div>

      {/* Soft keys, D-pad, call / end */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-label={softLeft ? `Left soft key: ${softLeft}` : "Left soft key"}
            onClick={() => onKey("softLeft")}
            className={cn(keyBase, "h-6 rounded-full bg-[#3a3f3c] hover:bg-[#454b47]")}
          />
          <button
            type="button"
            aria-label="Call"
            onClick={() => onKey("call")}
            className={cn(keyBase, "grid h-10 place-items-center rounded-2xl bg-[#3a3f3c] hover:bg-[#454b47]")}
          >
            <Phone className="h-5 w-5 text-[#4ade80]" aria-hidden="true" />
          </button>
        </div>

        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[#3a3f3c] shadow-inner">
          {(
            [
              { key: "up", cls: "top-1 left-1/2 -translate-x-1/2 h-6 w-10" },
              { key: "down", cls: "bottom-1 left-1/2 -translate-x-1/2 h-6 w-10" },
              { key: "left", cls: "left-1 top-1/2 -translate-y-1/2 h-10 w-6" },
              { key: "right", cls: "right-1 top-1/2 -translate-y-1/2 h-10 w-6" },
            ] as const
          ).map(({ key, cls }) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              onClick={() => onKey(key)}
              className={cn(keyBase, "absolute rounded-lg hover:bg-white/10", cls)}
            />
          ))}
          <button
            type="button"
            aria-label={okLabel ? `OK: ${okLabel}` : "OK"}
            onClick={() => onKey("ok")}
            className={cn(keyBase, "relative h-10 w-10 rounded-full bg-[#4a504c] text-[0.6rem] font-bold text-white/70 hover:bg-[#555c57]")}
          >
            OK
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-label={softRight ? `Right soft key: ${softRight}` : "Right soft key"}
            onClick={() => onKey("softRight")}
            className={cn(keyBase, "h-6 rounded-full bg-[#3a3f3c] hover:bg-[#454b47]")}
          />
          <button
            type="button"
            aria-label="End"
            onClick={() => onKey("end")}
            className={cn(keyBase, "grid h-10 place-items-center rounded-2xl bg-[#3a3f3c] hover:bg-[#454b47]")}
          >
            <PhoneOff className="h-5 w-5 text-[#f87171]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Number pad */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {KEYPAD.map(({ key, sub }) => (
          <button
            key={key}
            type="button"
            onClick={() => onKey(key)}
            className={cn(
              keyBase,
              "flex h-12 flex-col items-center justify-center rounded-[1.1rem] bg-[#3a3f3c] leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#454b47]",
            )}
          >
            <span className="text-lg font-semibold">{key}</span>
            <span className="mt-0.5 text-[0.55rem] uppercase tracking-wider text-white/45">{sub}</span>
          </button>
        ))}
      </div>

      <span aria-hidden="true" className="mx-auto mt-5 block h-1 w-1 rounded-full bg-black/70" />
    </div>
  );
}
