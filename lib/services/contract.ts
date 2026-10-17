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

/**
 * The single data/AI surface the UI is allowed to depend on.
 *
 * Every method is async and takes plain, serialisable arguments — so a real
 * implementation that calls `/api/saathi` and Firestore can drop in behind the
 * exact same interface (see `lib/services/index.ts`).
 */
export interface SaathiService {
  // Cases -----------------------------------------------------------------
  createCase(input: CreateCaseInput): Promise<Case>;
  getCase(ticket: Ticket): Promise<Case | null>;
  listCases(filter?: CaseFilter): Promise<Case[]>;
  updateCase(ticket: Ticket, patch: CasePatch): Promise<Case>;
  /** Live list, newest first. Returns an unsubscribe function. */
  listenCases(callback: (cases: Case[]) => void): Unsubscribe;

  // Conversations ---------------------------------------------------------
  appendTurns(ticket: Ticket, turns: NewTurn[]): Promise<ConversationMessage[]>;
  getConversation(ticket: Ticket): Promise<ConversationMessage[]>;
  listenConversation(
    ticket: Ticket,
    callback: (messages: ConversationMessage[]) => void,
  ): Unsubscribe;

  // Ticket lookup (borrowed-phone flow) -----------------------------------
  lookupTicket(ticketInput: string): Promise<Case | null>;

  // Follow-ups ------------------------------------------------------------
  triggerFollowUp(ticket: Ticket): Promise<Case>;
  clearRing(ticket: Ticket): Promise<Case>;
  getDueFollowUps(now?: Date): Promise<Case[]>;
  resolveFollowUp(ticket: Ticket, resolution: FollowUpResolution): Promise<Case>;

  // Escalation ------------------------------------------------------------
  escalateCase(ticket: Ticket, expertSummary?: string): Promise<Case>;

  // Dashboard -------------------------------------------------------------
  getDashboardStats(): Promise<DashboardStats>;
  getAlerts(): Promise<DashboardAlert[]>;

  // AI --------------------------------------------------------------------
  askSaathi(request: AskRequest): Promise<AskResponse>;

  // Demo data -------------------------------------------------------------
  seedDemoData(): Promise<number>;
  clearDemoData(): Promise<void>;
}
