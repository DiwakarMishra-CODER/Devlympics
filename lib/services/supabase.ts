import { computeAlerts } from "../alerts";
import { computeStats } from "../stats";
import { askSaathi } from "../ai";
import * as db from "../db";
import { supabase } from "../supabase";
import type { SaathiService } from "./contract";
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

type Row = Record<string, unknown>;

/** Stored turns have no id; the UI needs a stable one per message. */
function toMessages(ticket: Ticket, turns: unknown): ConversationMessage[] {
  if (!Array.isArray(turns)) return [];
  return turns.map((turn: { role: "user" | "saathi"; text: string; at: string }, index) => ({
    id: `${ticket}_${index}`,
    role: turn.role,
    text: turn.text,
    at: turn.at,
  }));
}

/** lib/db.js returns camelCase rows with nullable columns; the UI expects a full Case. */
function toCase(raw: unknown): Case {
  const row = raw as Row;
  const ticket = String(row.ticket);
  return {
    ...(row as unknown as Case),
    ticket,
    problem: (row.problem as string | null) ?? "",
    problemKey: (row.problemKey as string | null) ?? "",
    advice: (row.advice as string | null) ?? "",
    smsText: (row.smsText as string | null) ?? "",
    icons: (row.icons as Case["icons"] | null) ?? [],
    turns: toMessages(ticket, row.turns),
  };
}

async function mustGet(ticket: Ticket): Promise<Case> {
  const found = await db.getCase(ticket);
  if (!found) throw new Error(`Case not found: ${ticket}`);
  return toCase(found);
}

async function patchCase(ticket: Ticket, patch: CasePatch): Promise<Case> {
  await db.updateCase(ticket, patch);
  return mustGet(ticket);
}

async function listCases(filter?: CaseFilter): Promise<Case[]> {
  let query = supabase.from("cases").select("*").order("created_at", { ascending: false });
  if (filter?.status !== undefined) {
    query = query.in("status", Array.isArray(filter.status) ? filter.status : [filter.status]);
  }
  if (filter?.domain) query = query.eq("domain", filter.domain);
  if (filter?.district) query = query.eq("district", filter.district);
  if (filter?.problemKey) query = query.eq("problem_key", filter.problemKey);
  if (filter?.source) query = query.eq("source", filter.source);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list cases: ${error.message}`);
  return (data ?? []).map((row) => toCase(db.fromRow(row)));
}

/**
 * Real implementation of `SaathiService`: Supabase via lib/db.js for data,
 * /api/saathi via lib/ai.js for the AI. Mirrors lib/mock/service.ts behaviour.
 */
export function createSupabaseService(): SaathiService {
  return {
    async createCase(input: CreateCaseInput): Promise<Case> {
      // db.createCase always generates its own ticket
      const { turns, ticket: _ignored, ...fields } = input;
      void _ignored;
      const ticket = await db.createCase(fields);
      if (turns?.length) await db.appendTurns(ticket, turns);
      return mustGet(ticket);
    },

    async getCase(ticket: Ticket): Promise<Case | null> {
      const found = await db.getCase(ticket);
      return found ? toCase(found) : null;
    },

    listCases,

    updateCase: patchCase,

    listenCases(callback: (cases: Case[]) => void): Unsubscribe {
      return db.listenCases((rows: unknown[]) => callback(rows.map(toCase))) as Unsubscribe;
    },

    async appendTurns(ticket: Ticket, turns: NewTurn[]): Promise<ConversationMessage[]> {
      await db.appendTurns(ticket, turns);
      return (await mustGet(ticket)).turns;
    },

    async getConversation(ticket: Ticket): Promise<ConversationMessage[]> {
      const found = await db.getCase(ticket);
      return found ? toCase(found).turns : [];
    },

    listenConversation(ticket: Ticket, callback: (messages: ConversationMessage[]) => void): Unsubscribe {
      return db.listenCase(ticket, (row: unknown) => callback(row ? toCase(row).turns : [])) as Unsubscribe;
    },

    async lookupTicket(ticketInput: string): Promise<Case | null> {
      const digits = ticketInput.replace(/\D+/g, "");
      if (digits.length !== 4) return null;
      const found = await db.getCase(digits);
      return found ? toCase(found) : null;
    },

    triggerFollowUp(ticket: Ticket): Promise<Case> {
      return patchCase(ticket, { ringNow: true, status: "follow_up_due", followUpAt: new Date().toISOString() });
    },

    clearRing(ticket: Ticket): Promise<Case> {
      return patchCase(ticket, { ringNow: false });
    },

    async getDueFollowUps(now: Date = new Date()): Promise<Case[]> {
      const due = await listCases({ status: "follow_up_due" });
      return due.filter((item) => item.ringNow || (item.followUpAt !== null && new Date(item.followUpAt) <= now));
    },

    async resolveFollowUp(ticket: Ticket, resolution: FollowUpResolution): Promise<Case> {
      const existing = await mustGet(ticket);
      return patchCase(ticket, {
        ringNow: false,
        status: resolution.resolved ? "resolved" : "escalated",
        expertSummary: resolution.resolved ? null : resolution.expertSummary ?? existing.expertSummary,
      });
    },

    async escalateCase(ticket: Ticket, expertSummary?: string): Promise<Case> {
      const existing = await mustGet(ticket);
      return patchCase(ticket, { status: "escalated", ringNow: false, expertSummary: expertSummary ?? existing.expertSummary });
    },

    async getDashboardStats(): Promise<DashboardStats> {
      return computeStats(await listCases());
    },

    async getAlerts(): Promise<DashboardAlert[]> {
      return computeAlerts(await listCases());
    },

    askSaathi(request: AskRequest): Promise<AskResponse> {
      return askSaathi(request);
    },

    seedDemoData(): Promise<number> {
      return db.seedDemoData();
    },

    clearDemoData(): Promise<void> {
      return db.clearDemoData();
    },
  };
}
