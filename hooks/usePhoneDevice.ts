"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_NUMBER,
  isPlausibleNumber,
  isSampleNumber,
} from "@/lib/phone/demo";
import { createSeedRecents, type RecentCall } from "@/lib/phone/recents";
import type { UsePhoneCall } from "./usePhoneCall";

export type DeviceView = "home" | "phone";
export type PhoneTab = "keypad" | "recents" | "contacts";

const MAX_DIAL_LENGTH = 15;
const KEYPAD_DIGITS = "0123456789*#";
const NOTICE_MS = 2600;

export interface UsePhoneDevice {
  view: DeviceView;
  tab: PhoneTab;
  dialed: string;
  numberError: string | null;
  notice: string | null;
  recents: readonly RecentCall[];
  goHome: () => void;
  openPhone: (tab?: PhoneTab) => void;
  setTab: (tab: PhoneTab) => void;
  pressKey: (key: string) => void;
  backspace: () => void;
  clearDial: () => void;
  placeCall: () => void;
  callContact: (number: string, callable: boolean) => void;
  notify: (message: string) => void;
  dismissNotice: () => void;
}

/**
 * Device-level state that sits *around* the call engine: which app is open,
 * the dialer buffer, an honest-availability notice, and the recent-call log.
 * The call engine stays the single source of truth for the call itself.
 */
export function usePhoneDevice(call: UsePhoneCall): UsePhoneDevice {
  const [view, setView] = useState<DeviceView>("home");
  const [tab, setTab] = useState<PhoneTab>("keypad");
  const [dialed, setDialed] = useState("");
  const [numberError, setNumberError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recents, setRecents] = useState<readonly RecentCall[]>([]);

  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEndedRef = useRef<string | null>(null);

  // Seed the log on the client only, so server and first client render agree.
  useEffect(() => {
    setRecents((current) => (current.length === 0 ? createSeedRecents() : current));
  }, []);

  const clearNoticeTimer = useCallback((): void => {
    if (noticeTimerRef.current !== null) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearNoticeTimer(), [clearNoticeTimer]);

  const notify = useCallback(
    (message: string): void => {
      clearNoticeTimer();
      setNotice(message);
      noticeTimerRef.current = setTimeout(() => {
        noticeTimerRef.current = null;
        setNotice(null);
      }, NOTICE_MS);
    },
    [clearNoticeTimer],
  );

  const dismissNotice = useCallback((): void => {
    clearNoticeTimer();
    setNotice(null);
  }, [clearNoticeTimer]);

  // Fold finished calls into Recents, exactly once per call id.
  const ended = call.endedCall;
  useEffect(() => {
    if (!ended) return;
    if (lastEndedRef.current === ended.id) return;
    lastEndedRef.current = ended.id;

    const entry: RecentCall = {
      id: ended.id,
      number: ended.number,
      label: ended.label,
      direction: ended.direction,
      outcome: ended.missed ? "missed" : "answered",
      at: ended.at,
      durationMs: ended.durationMs,
      ticket: ended.ticket,
    };
    setRecents((current) => [entry, ...current]);
  }, [ended]);

  const goHome = useCallback((): void => {
    setView("home");
    setNumberError(null);
  }, []);

  const openPhone = useCallback((nextTab?: PhoneTab): void => {
    if (nextTab) setTab(nextTab);
    setView("phone");
    setNumberError(null);
  }, []);

  const pressKey = useCallback((key: string): void => {
    if (!KEYPAD_DIGITS.includes(key)) return;
    setNumberError(null);
    setDialed((current) => (current.length >= MAX_DIAL_LENGTH ? current : current + key));
  }, []);

  const backspace = useCallback((): void => {
    setNumberError(null);
    setDialed((current) => current.slice(0, -1));
  }, []);

  const clearDial = useCallback((): void => {
    setNumberError(null);
    setDialed("");
  }, []);

  const placeCall = useCallback((): void => {
    if (!isPlausibleNumber(dialed)) {
      setNumberError("Enter a number to call.");
      return;
    }
    if (!isSampleNumber(dialed)) {
      setNumberError("Only the Saathi demo number can be called in this demo.");
      return;
    }
    setNumberError(null);
    setDialed("");
    call.startOutgoingCall(DEMO_NUMBER);
  }, [call, dialed]);

  const callContact = useCallback(
    (number: string, callable: boolean): void => {
      if (!callable) {
        notify("Only the Saathi demo number can be called in this demo.");
        return;
      }
      setDialed("");
      setNumberError(null);
      call.startOutgoingCall(number);
    },
    [call, notify],
  );

  return useMemo(
    () => ({
      view,
      tab,
      dialed,
      numberError,
      notice,
      recents,
      goHome,
      openPhone,
      setTab,
      pressKey,
      backspace,
      clearDial,
      placeCall,
      callContact,
      notify,
      dismissNotice,
    }),
    [
      view,
      tab,
      dialed,
      numberError,
      notice,
      recents,
      goHome,
      openPhone,
      pressKey,
      backspace,
      clearDial,
      placeCall,
      callContact,
      notify,
      dismissNotice,
    ],
  );
}
