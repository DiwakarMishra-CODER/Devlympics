import type { SaathiService } from "./contract";
import { createMockService } from "../mock/service";

/**
 * Swap point. The UI only ever calls `getServices()`. When the real backend is
 * ready, either return an `HttpSaathiService` here or call `setServices()` at
 * app startup — no UI changes required.
 */
let instance: SaathiService | null = null;

export function getServices(): SaathiService {
  if (!instance) instance = createMockService();
  return instance;
}

/** Override the active implementation (used for tests or backend rollout). */
export function setServices(service: SaathiService | null): void {
  instance = service;
}

export type { SaathiService } from "./contract";
