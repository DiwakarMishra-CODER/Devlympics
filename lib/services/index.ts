import type { SaathiService } from "./contract";
import { createMockService } from "../mock/service";
import { createSupabaseService } from "./supabase";
import { isSupabaseConfigured } from "../supabase";

/**
 * Swap point. The UI only ever calls `getServices()`. Uses the real backend
 * (Supabase + /api/saathi) when Supabase env vars are set, else the mock.
 */
let instance: SaathiService | null = null;

export function getServices(): SaathiService {
  if (!instance) instance = isSupabaseConfigured ? createSupabaseService() : createMockService();
  return instance;
}

/** Override the active implementation (used for tests or backend rollout). */
export function setServices(service: SaathiService | null): void {
  instance = service;
}

export type { SaathiService } from "./contract";
