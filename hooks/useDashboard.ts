"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeAlerts } from "@/lib/alerts";
import { getServices } from "@/lib/services";
import { computeStats } from "@/lib/stats";
import type { Case, DashboardAlert, DashboardStats, Ticket } from "@/lib/types";

export type DashboardStatus = "loading" | "ready" | "error";
export type DashboardAction = "seed" | "clear" | "follow-up";
export type NewRowPredicate = (ticket: Ticket) => boolean;

/** How long a newly arrived row stays highlighted. */
const FLASH_MS = 2000;

export interface UseDashboard {
  status: DashboardStatus;
  loading: boolean;
  cases: readonly Case[];
  stats: DashboardStats;
  alerts: DashboardAlert[];
  seedCount: number;
  liveCount: number;
  isNew: NewRowPredicate;
  actionBusy: DashboardAction | null;
  actionError: string | null;
  streamError: string | null;
  seed: () => Promise<void>;
  clear: () => Promise<void>;
  fastForward: (ticket: Ticket) => Promise<void>;
  retry: () => void;
}

/**
 * Single source of truth for the console: one live subscription to the case
 * store, with stats and alerts derived from the same snapshot so the three
 * panels can never disagree.
 */
export function useDashboard(): UseDashboard {
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [cases, setCases] = useState<readonly Case[]>([]);
  const [flashing, setFlashing] = useState<ReadonlySet<Ticket>>(() => new Set());
  const [actionBusy, setActionBusy] = useState<DashboardAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const seenRef = useRef<Set<Ticket> | null>(null);
  const timersRef = useRef<Map<Ticket, ReturnType<typeof setTimeout>>>(new Map());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;

    const onSnapshot = (next: readonly Case[]): void => {
      if (!mountedRef.current) return;
      setCases(next);
      setStatus("ready");
      setStreamError(null);

      const seen = seenRef.current;
      const arrived: Ticket[] = [];

      if (seen === null) {
        // First snapshot: treat everything as pre-existing, nothing flashes.
        seenRef.current = new Set(next.map((item) => item.ticket));
      } else {
        for (const item of next) {
          if (seen.has(item.ticket)) continue;
          seen.add(item.ticket);
          // Only live cases flash; re-loaded demo rows would be noise.
          if (item.source === "live") arrived.push(item.ticket);
        }
      }

      if (arrived.length === 0) return;

      setFlashing((previous) => {
        const draft = new Set(previous);
        for (const ticket of arrived) draft.add(ticket);
        return draft;
      });

      for (const ticket of arrived) {
        const existing = timers.get(ticket);
        if (existing) clearTimeout(existing);
        timers.set(
          ticket,
          setTimeout(() => {
            timers.delete(ticket);
            if (!mountedRef.current) return;
            setFlashing((previous) => {
              const draft = new Set(previous);
              draft.delete(ticket);
              return draft;
            });
          }, FLASH_MS),
        );
      }
    };

    let unsubscribe: () => void = () => undefined;
    try {
      unsubscribe = getServices().listenCases(onSnapshot);
    } catch (error) {
      if (mountedRef.current) {
        setStatus("error");
        setStreamError(
          error instanceof Error && error.message
            ? error.message
            : "Could not connect to the case stream.",
        );
      }
    }

    return () => {
      mountedRef.current = false;
      unsubscribe();
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, [reloadKey]);

  const stats = useMemo(() => computeStats(cases), [cases]);
  const alerts = useMemo(() => computeAlerts(cases), [cases]);

  const seedCount = useMemo(
    () => cases.filter((item) => item.source === "seed").length,
    [cases],
  );
  const liveCount = cases.length - seedCount;

  const run = useCallback(
    async (action: DashboardAction, work: () => Promise<unknown>): Promise<void> => {
      setActionBusy(action);
      setActionError(null);
      try {
        await work();
      } catch (error) {
        if (mountedRef.current) {
          setActionError(
            error instanceof Error && error.message
              ? error.message
              : "Something went wrong. Please try again.",
          );
        }
      } finally {
        if (mountedRef.current) setActionBusy(null);
      }
    },
    [],
  );

  const seed = useCallback(
    () => run("seed", () => getServices().seedDemoData()),
    [run],
  );

  const clear = useCallback(
    () => run("clear", () => getServices().clearDemoData()),
    [run],
  );

  const fastForward = useCallback(
    (ticket: Ticket) => run("follow-up", () => getServices().triggerFollowUp(ticket)),
    [run],
  );

  const isNew = useCallback<NewRowPredicate>(
    (ticket) => flashing.has(ticket),
    [flashing],
  );

  const retry = useCallback((): void => {
    seenRef.current = null;
    setStatus("loading");
    setStreamError(null);
    setReloadKey((key) => key + 1);
  }, []);

  return useMemo(
    () => ({
      status,
      loading: status === "loading",
      cases,
      stats,
      alerts,
      seedCount,
      liveCount,
      isNew,
      actionBusy,
      actionError,
      streamError,
      seed,
      clear,
      fastForward,
      retry,
    }),
    [
      status,
      cases,
      stats,
      alerts,
      seedCount,
      liveCount,
      isNew,
      actionBusy,
      actionError,
      streamError,
      seed,
      clear,
      fastForward,
      retry,
    ],
  );
}
