import { computeAlerts } from "../alerts";
import { MOCK_CONFIG } from "./config";
import { buildDemoCases } from "./fixtures";
import { mockAskSaathi } from "./ai";
import { MockCaseStore } from "./store";
import type { SaathiService } from "../services/contract";
import type {
  AskRequest,
  AskResponse,
  Case,
  CaseFilter,
  CasePatch,
  ConversationMessage,
  CreateCaseInput,
  DashboardAlert,
  DashboardStats,
  FollowUpResolution,
  NewTurn,
  Ticket,
  Unsubscribe,
} from "../types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function latency(): Promise<void> {
  const { min, max } = MOCK_CONFIG.latencyMs;
  return sleep(min + Math.random() * (max - min));
}

/**
 * In-memory implementation of `SaathiService` — the stand-in for the
 * Firestore + `/api/saathi` backend. Behaviour mirrors the frozen contract
 * (status transitions, ring flags, early-warning rule) so the UI behaves
 * identically once the real backend lands.
 */
export function createMockService(): SaathiService {
  const store = new MockCaseStore();

  if (MOCK_CONFIG.autoSeedDemoData && store.size() === 0) {
    store.addAll(buildDemoCases());
  }

  const requireCase = (ticket: Ticket): Case => {
    const found = store.get(ticket);
    if (!found) throw new Error(`Case not found: ${ticket}`);
    return found;
  };

  return {
    async createCase(input: CreateCaseInput): Promise<Case> {
      await latency();
      return store.create(input);
    },

    async getCase(ticket: Ticket): Promise<Case | null> {
      await latency();
      return store.get(ticket);
    },

    async listCases(filter?: CaseFilter): Promise<Case[]> {
      await latency();
      return store.list(filter);
    },

    async updateCase(ticket: Ticket, patch: CasePatch): Promise<Case> {
      await latency();
      return store.update(ticket, patch);
    },

    listenCases(callback: (cases: Case[]) => void): Unsubscribe {
      const emit = (): void => callback(store.list());
      emit();
      return store.subscribe(emit);
    },

    async appendTurns(ticket: Ticket, turns: NewTurn[]): Promise<ConversationMessage[]> {
      await latency();
      return store.appendTurns(ticket, turns);
    },

    async getConversation(ticket: Ticket): Promise<ConversationMessage[]> {
      await latency();
      return store.getConversation(ticket);
    },

    listenConversation(
      ticket: Ticket,
      callback: (messages: ConversationMessage[]) => void,
    ): Unsubscribe {
      const emit = (): void => callback(store.getConversation(ticket));
      emit();
      return store.subscribe(emit);
    },

    async lookupTicket(ticketInput: string): Promise<Case | null> {
      await latency();
      const digits = ticketInput.replace(/\D+/g, "");
      if (digits.length !== 4) return null;
      return store.get(digits);
    },

    async triggerFollowUp(ticket: Ticket): Promise<Case> {
      await latency();
      return store.update(ticket, {
        ringNow: true,
        status: "follow_up_due",
        followUpAt: new Date().toISOString(),
      });
    },

    async clearRing(ticket: Ticket): Promise<Case> {
      await latency();
      return store.update(ticket, { ringNow: false });
    },

    async getDueFollowUps(now: Date = new Date()): Promise<Case[]> {
      await latency();
      return store.list({ status: "follow_up_due" }).filter((item) => {
        if (item.ringNow) return true;
        if (!item.followUpAt) return false;
        return new Date(item.followUpAt).getTime() <= now.getTime();
      });
    },

    async resolveFollowUp(ticket: Ticket, resolution: FollowUpResolution): Promise<Case> {
      await latency();
      const status = resolution.resolved ? "resolved" : "escalated";
      return store.update(ticket, {
        ringNow: false,
        status,
        expertSummary: resolution.resolved
          ? null
          : resolution.expertSummary ?? requireCase(ticket).expertSummary,
      });
    },

    async escalateCase(ticket: Ticket, expertSummary?: string): Promise<Case> {
      await latency();
      const existing = requireCase(ticket);
      return store.update(ticket, {
        status: "escalated",
        ringNow: false,
        expertSummary: expertSummary ?? existing.expertSummary,
      });
    },

    async getDashboardStats(): Promise<DashboardStats> {
      await latency();
      const items = store.list();
      const stats: DashboardStats = {
        open: 0,
        followUpDue: 0,
        escalated: 0,
        resolved: 0,
        total: items.length,
      };
      for (const item of items) {
        if (item.status === "open") stats.open += 1;
        else if (item.status === "follow_up_due") stats.followUpDue += 1;
        else if (item.status === "escalated") stats.escalated += 1;
        else stats.resolved += 1;
      }
      return stats;
    },

    async getAlerts(): Promise<DashboardAlert[]> {
      await latency();
      return computeAlerts(store.list());
    },

    async askSaathi(request: AskRequest): Promise<AskResponse> {
      await latency();
      return mockAskSaathi(request);
    },

    async seedDemoData(): Promise<number> {
      await latency();
      store.clearSource("seed");
      const cases = buildDemoCases();
      store.addAll(cases);
      return cases.length;
    },

    async clearDemoData(): Promise<void> {
      await latency();
      store.clearSource("seed");
    },
  };
}
