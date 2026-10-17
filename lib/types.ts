/**
 * Saathi domain model & contracts.
 *
 * These types mirror the shapes agreed with the backend (project brief
 * section 4) so the mock layer in `lib/mock` can be swapped for real HTTP
 * calls without touching the UI. Timestamps are ISO strings here; the real
 * backend may use Firestore Timestamps and adapt at its boundary.
 *
 * The four unions below (CaseStatus, Severity, Domain, AppLanguage) are also
 * consumed by the shared UI components — keep their names stable.
 */

// ---- Shared unions -------------------------------------------------

export type CaseStatus = "open" | "follow_up_due" | "escalated" | "resolved";
export type Severity = "low" | "medium" | "high";
export type Domain = "farming" | "schemes" | "health" | "other";
export type AppLanguage = "hi-IN" | "en-IN";

export type CaseSource = "live" | "seed";
/** Four-digit case ticket, e.g. "4721". */
export type Ticket = string;

/** Icon keys from the project brief (section 4.6). */
export type IconKey =
  | "water"
  | "no_spray"
  | "fertilizer"
  | "visit_kvk"
  | "visit_office"
  | "document"
  | "doctor"
  | "call_112"
  | "come_back"
  | "wait";

export const ICON_KEYS: readonly IconKey[] = [
  "water",
  "no_spray",
  "fertilizer",
  "visit_kvk",
  "visit_office",
  "document",
  "doctor",
  "call_112",
  "come_back",
  "wait",
];

export const DOMAINS: readonly Domain[] = [
  "farming",
  "schemes",
  "health",
  "other",
];

export const CASE_STATUSES: readonly CaseStatus[] = [
  "open",
  "follow_up_due",
  "escalated",
  "resolved",
];

// ---- Conversation --------------------------------------------------

/** A stored conversation turn. Matches the `turns` field on a case. */
export type MessageRole = "user" | "saathi";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  text: string;
  /** ISO timestamp. */
  at: string;
}

/** A turn to append. `at` is filled by the data layer when omitted. */
export interface NewTurn {
  role: MessageRole;
  text: string;
  at?: string;
}

// ---- Case ----------------------------------------------------------

export interface Case {
  ticket: Ticket;
  name: string | null;
  language: AppLanguage;
  domain: Domain;
  district: string | null;
  subject: string | null;
  problem: string;
  problemKey: string;
  severity: Severity;
  status: CaseStatus;
  advice: string;
  smsText: string;
  icons: IconKey[];
  turns: ConversationMessage[];
  expertSummary: string | null;
  ringNow: boolean;
  followUpAt: string | null;
  createdAt: string;
  updatedAt: string;
  source: CaseSource;
}

export interface CreateCaseInput {
  ticket?: Ticket;
  name?: string | null;
  language?: AppLanguage;
  domain: Domain;
  district?: string | null;
  subject?: string | null;
  problem: string;
  problemKey: string;
  severity?: Severity;
  status?: CaseStatus;
  advice?: string;
  smsText?: string;
  icons?: IconKey[];
  turns?: NewTurn[];
  expertSummary?: string | null;
  ringNow?: boolean;
  followUpAt?: string | null;
  source?: CaseSource;
}

export type CasePatch = Partial<
  Pick<
    Case,
    | "name"
    | "language"
    | "domain"
    | "district"
    | "subject"
    | "problem"
    | "problemKey"
    | "severity"
    | "status"
    | "advice"
    | "smsText"
    | "icons"
    | "expertSummary"
    | "ringNow"
    | "followUpAt"
  >
>;

export interface CaseFilter {
  status?: CaseStatus | CaseStatus[];
  domain?: Domain;
  district?: string;
  problemKey?: string;
  source?: CaseSource;
}

// ---- AI contracts --------------------------------------------------

export type AskMode = "first_call" | "follow_up";

/** A message in the AI request history (role names differ from stored turns). */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** The saved case handed to the AI on a follow-up call. */
export interface CaseContext {
  name: string | null;
  domain: Domain;
  subject: string | null;
  problem: string;
  problemKey: string;
  severity: Severity;
  advice: string;
  district: string | null;
}

/** The case object returned inside an AI response (pre-persist). */
export interface DraftCase {
  name: string | null;
  district: string | null;
  domain: Domain;
  subject: string | null;
  problem: string;
  problemKey: string;
  severity: Severity;
  escalate: boolean;
}

export interface AskRequest {
  mode: AskMode;
  language: AppLanguage;
  history: ChatMessage[];
  caseContext: CaseContext | null;
}

export interface AskResponse {
  reply: string;
  done: boolean;
  case: DraftCase;
  advice: string;
  smsText: string;
  icons: IconKey[];
  /** Follow-up only: true / false, or null when unclear. */
  resolved: boolean | null;
  expertSummary: string | null;
}

// ---- Dashboard -----------------------------------------------------

export interface DashboardStats {
  open: number;
  followUpDue: number;
  escalated: number;
  resolved: number;
  total: number;
}

export interface DashboardAlert {
  id: string;
  district: string;
  domain: Domain;
  subject: string | null;
  problemKey: string;
  count: number;
  windowDays: number;
  severity: Severity;
  firstSeenAt: string;
  lastSeenAt: string;
}

// ---- Follow-ups ----------------------------------------------------

export interface FollowUpResolution {
  resolved: boolean;
  expertSummary?: string | null;
}

export type Unsubscribe = () => void;
