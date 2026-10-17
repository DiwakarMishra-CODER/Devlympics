import { MOCK_CONFIG } from "./config";
import type {
  Case,
  CaseFilter,
  CasePatch,
  ConversationMessage,
  CreateCaseInput,
  NewTurn,
  Ticket,
} from "../types";

export type StoreListener = () => void;

const TICKET_MIN = 1000;
const TICKET_MAX = 9999;

let messageCounter = 0;
function nextMessageId(ticket: Ticket): string {
  messageCounter += 1;
  return `msg_${ticket}_${messageCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

function matchesFilter(item: Case, filter: CaseFilter): boolean {
  if (filter.status !== undefined) {
    const wanted = Array.isArray(filter.status) ? filter.status : [filter.status];
    if (!wanted.includes(item.status)) return false;
  }
  if (filter.domain !== undefined && item.domain !== filter.domain) return false;
  if (filter.district !== undefined && item.district !== filter.district) return false;
  if (filter.problemKey !== undefined && item.problemKey !== filter.problemKey) return false;
  if (filter.source !== undefined && item.source !== filter.source) return false;
  return true;
}

/**
 * In-memory case store with a simple subscription model. This is the mock
 * stand-in for Firestore; it deliberately exposes the same operations the real
 * data layer will.
 */
export class MockCaseStore {
  private readonly cases = new Map<Ticket, Case>();
  private readonly listeners = new Set<StoreListener>();

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  size(): number {
    return this.cases.size;
  }

  list(filter?: CaseFilter): Case[] {
    let items = Array.from(this.cases.values());
    if (filter) items = items.filter((item) => matchesFilter(item, filter));
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(ticket: Ticket): Case | null {
    return this.cases.get(ticket) ?? null;
  }

  has(ticket: Ticket): boolean {
    return this.cases.has(ticket);
  }

  create(input: CreateCaseInput): Case {
    const createdAt = new Date();
    const createdAtIso = createdAt.toISOString();
    const ticket = this.resolveTicket(input.ticket);
    const turns = (input.turns ?? []).map((turn, index) =>
      this.toMessage(ticket, turn, createdAt, index),
    );

    const record: Case = {
      ticket,
      name: input.name ?? null,
      language: input.language ?? "en-IN",
      domain: input.domain,
      district: input.district ?? null,
      subject: input.subject ?? null,
      problem: input.problem,
      problemKey: input.problemKey,
      severity: input.severity ?? "medium",
      status: input.status ?? "open",
      advice: input.advice ?? "",
      smsText: input.smsText ?? "",
      icons: input.icons ?? [],
      turns,
      expertSummary: input.expertSummary ?? null,
      ringNow: input.ringNow ?? false,
      followUpAt:
        input.followUpAt ?? addDays(createdAt, MOCK_CONFIG.followUpAfterDays).toISOString(),
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
      source: input.source ?? "live",
    };

    this.cases.set(ticket, record);
    this.emit();
    return record;
  }

  update(ticket: Ticket, patch: CasePatch): Case {
    const existing = this.cases.get(ticket);
    if (!existing) throw new Error(`Case not found: ${ticket}`);

    const next = {
      ...existing,
      ...stripUndefined(patch),
      updatedAt: nowIso(),
    } as Case;
    this.cases.set(ticket, next);
    this.emit();
    return next;
  }

  appendTurns(ticket: Ticket, turns: NewTurn[]): ConversationMessage[] {
    const existing = this.cases.get(ticket);
    if (!existing) throw new Error(`Case not found: ${ticket}`);

    const base = new Date();
    const created = turns.map((turn, index) =>
      this.toMessage(ticket, turn, base, index),
    );
    const next: Case = {
      ...existing,
      turns: [...existing.turns, ...created],
      updatedAt: nowIso(),
    };
    this.cases.set(ticket, next);
    this.emit();
    return next.turns;
  }

  getConversation(ticket: Ticket): ConversationMessage[] {
    return this.cases.get(ticket)?.turns ?? [];
  }

  addAll(items: readonly Case[]): void {
    for (const item of items) this.cases.set(item.ticket, item);
    this.emit();
  }

  clearSource(source: Case["source"]): void {
    let changed = false;
    for (const [ticket, item] of Array.from(this.cases.entries())) {
      if (item.source === source) {
        this.cases.delete(ticket);
        changed = true;
      }
    }
    if (changed) this.emit();
  }

  clear(): void {
    if (this.cases.size === 0) return;
    this.cases.clear();
    this.emit();
  }

  private toMessage(
    ticket: Ticket,
    turn: NewTurn,
    base: Date,
    index: number,
  ): ConversationMessage {
    const at = turn.at ?? new Date(base.getTime() + index * 1000).toISOString();
    return { id: nextMessageId(ticket), role: turn.role, text: turn.text, at };
  }

  private resolveTicket(preferred?: Ticket): Ticket {
    if (preferred && /^\d{4}$/.test(preferred) && !this.cases.has(preferred)) {
      return preferred;
    }
    return this.allocateTicket();
  }

  private allocateTicket(): Ticket {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const span = TICKET_MAX - TICKET_MIN + 1;
      const candidate = String(TICKET_MIN + Math.floor(Math.random() * span));
      if (!this.cases.has(candidate)) return candidate;
    }
    for (let n = TICKET_MIN; n <= TICKET_MAX; n += 1) {
      const candidate = String(n);
      if (!this.cases.has(candidate)) return candidate;
    }
    throw new Error("No free ticket available");
  }
}
