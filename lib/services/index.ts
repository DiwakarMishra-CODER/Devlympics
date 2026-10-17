import type { SaathiService } from "./contract";
import { createSupabaseService } from "./supabase";
import { isSupabaseConfigured } from "../supabase";

/**
 * Swap point. The UI only ever calls `getServices()`, which is backed by
 * Supabase (lib/db.js) and the /api/saathi route.
 */
let instance: SaathiService | null = null;

export function getServices(): SaathiService {
  if (!instance) {
    if (!isSupabaseConfigured) {
      console.error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    }
    instance = createSupabaseService();
  }
  return instance;
}

/** Override the active implementation (used for tests). */
export function setServices(service: SaathiService | null): void {
  instance = service;
}

export type { SaathiService } from "./contract";
