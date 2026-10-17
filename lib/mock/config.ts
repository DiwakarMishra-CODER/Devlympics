/**
 * Tuning for the mock layer only. Nothing here should be imported by UI
 * components or by the future real backend.
 */
export const MOCK_CONFIG = {
  /** Simulated latency per call, so loading/speaking states are visible. */
  latencyMs: { min: 90, max: 240 },
  /** Preload the in-memory store with demo cases on first use. */
  autoSeedDemoData: true,
  /** Follow-up is scheduled this many days out. */
  followUpAfterDays: 3,
} as const;
