import { supabase } from "./supabase.js";
import { buildSeedCases } from "./seed.js";

// Key mappings between frontend (camelCase) and PostgreSQL (snake_case)
const MAP = {
  problemKey: "problem_key",
  smsText: "sms_text",
  expertSummary: "expert_summary",
  ringNow: "ring_now",
  followUpAt: "follow_up_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const BACK = Object.fromEntries(
  Object.entries(MAP).map(([clientKey, dbKey]) => [dbKey, clientKey])
);

/**
 * Converts a frontend camelCase object to a Supabase snake_case row.
 * CRITICAL: Only explicitly defined fields are included; undefined keys are skipped
 * so partial updates never overwrite or erase existing columns.
 *
 * @param {Object} obj
 * @returns {Object}
 */
export function toRow(obj) {
  if (!obj || typeof obj !== "object") return {};
  const row = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      const dbKey = MAP[key] || key;
      row[dbKey] = value;
    }
  }
  return row;
}

/**
 * Converts a Supabase snake_case row to a frontend camelCase object.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
export function fromRow(row) {
  if (!row || typeof row !== "object") return null;
  const obj = {};
  for (const [key, value] of Object.entries(row)) {
    const clientKey = BACK[key] || key;
    obj[clientKey] = value;
  }
  return obj;
}

/**
 * Creates a new case with an atomic 4-digit ticket between 1000 and 8999.
 * Retries up to 10 times if a collision (error 23505) occurs.
 *
 * @param {Object} fields
 * @returns {Promise<string>} The generated 4-digit ticket number
 */
export async function createCase(fields = {}) {
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate random 4-digit ticket in live range 1000–8999
    const ticket = Math.floor(1000 + Math.random() * 8000).toString();

    const caseData = {
      status: "open",
      ringNow: false,
      source: "live",
      ...fields,
      ticket,
    };

    const row = toRow(caseData);

    const { error } = await supabase.from("cases").insert(row);

    if (!error) {
      return ticket;
    }

    // PostgreSQL error code 23505: unique_violation
    if (error.code === "23505" || error.message?.includes("duplicate key")) {
      continue;
    }

    throw new Error(`Failed to create case: ${error.message || JSON.stringify(error)}`);
  }

  throw new Error("Failed to generate a unique ticket after 10 attempts");
}

/**
 * Retrieves a single case by ticket.
 *
 * @param {string} ticket
 * @returns {Promise<Object|null>} camelCase case object or null if not found
 */
export async function getCase(ticket) {
  if (!ticket) return null;

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("ticket", String(ticket))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get case #${ticket}: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) return null;
  return fromRow(data);
}

/**
 * Updates only explicitly supplied fields in a case.
 * Throws if the ticket does not exist or if database constraints fail.
 *
 * @param {string} ticket
 * @param {Object} patch
 * @returns {Promise<void>}
 */
export async function updateCase(ticket, patch) {
  if (!ticket) throw new Error("Ticket is required for updateCase");
  if (!patch || typeof patch !== "object") throw new Error("Patch object is required for updateCase");

  const row = toRow(patch);
  if (Object.keys(row).length === 0) {
    // Ensure the case exists even if patch is empty
    const existing = await getCase(ticket);
    if (!existing) {
      throw new Error(`Case #${ticket} not found for update`);
    }
    return;
  }

  const { data, error } = await supabase
    .from("cases")
    .update(row)
    .eq("ticket", String(ticket))
    .select();

  if (error) {
    throw new Error(`Failed to update case #${ticket}: ${error.message || JSON.stringify(error)}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Case #${ticket} not found for update`);
  }
}

/**
 * Atomically appends conversation turns to an existing case using the PostgreSQL append_turns RPC.
 * Each turn must have { role, text, at }. Missing 'at' is filled with the current ISO timestamp.
 *
 * @param {string} ticket
 * @param {Array<{role: string, text: string, at?: string}>} turns
 * @returns {Promise<void>}
 */
export async function appendTurns(ticket, turns) {
  if (!ticket) throw new Error("Ticket is required to append turns");
  if (!Array.isArray(turns) || turns.length === 0) return;

  const validatedTurns = turns.map((turn, index) => {
    if (!turn || typeof turn !== "object") {
      throw new Error(`Invalid turn at index ${index}`);
    }
    if (turn.role !== "user" && turn.role !== "saathi") {
      throw new Error(
        `Invalid turn role '${turn.role}' at index ${index}. Allowed roles are 'user' and 'saathi'.`
      );
    }
    return {
      role: turn.role,
      text: String(turn.text || ""),
      at: turn.at || new Date().toISOString(),
    };
  });

  const { error } = await supabase.rpc("append_turns", {
    p_ticket: String(ticket),
    p_turns: validatedTurns,
  });

  if (error) {
    throw new Error(`Failed to append turns for case #${ticket}: ${error.message || JSON.stringify(error)}`);
  }
}

/**
 * Listens to all case updates in real-time.
 * - Immediately returns an unsubscribe function.
 * - Fetches newest 200 cases ordered by created_at descending.
 * - Re-fetches with 300ms debounce on any INSERT/UPDATE/DELETE.
 * - Prevents overlapping/stale fetches from delivering outdated snapshots.
 *
 * @param {Function} callback - Called with Array<CaseObject>
 * @returns {Function} unsubscribe
 */
export function listenCases(callback) {
  let timer = null;
  let active = true;
  let latestRequestId = 0;

  const load = async () => {
    const requestId = ++latestRequestId;
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!active || requestId !== latestRequestId) return;

      if (error) {
        console.error("listenCases query error:", error);
        return;
      }

      if (data) {
        callback(data.map(fromRow));
      }
    } catch (err) {
      if (active) {
        console.error("listenCases unexpected error:", err);
      }
    }
  };

  // Initial fetch
  load();

  // Create unique channel to avoid colliding with React StrictMode double invocations
  const channelName = `cases-all-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cases" },
      () => {
        if (!active) return;
        clearTimeout(timer);
        timer = setTimeout(load, 300);
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error("listenCases subscription error:", err);
      }
    });

  return () => {
    active = false;
    clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}

/**
 * Listens to real-time changes for a single ticket.
 * - Fetches initial case.
 * - Dispatches updates on INSERT/UPDATE.
 * - Dispatches null on DELETE.
 * - Returns an unsubscribe function.
 *
 * @param {string} ticket
 * @param {Function} callback - Called with CaseObject or null
 * @returns {Function} unsubscribe
 */
export function listenCase(ticket, callback) {
  if (!ticket) return () => {};
  let active = true;

  const load = async () => {
    try {
      const caseObj = await getCase(ticket);
      if (active) {
        callback(caseObj);
      }
    } catch (err) {
      if (active) {
        console.error(`listenCase(${ticket}) query error:`, err);
      }
    }
  };

  // Initial fetch
  load();

  const channelName = `case-${ticket}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cases",
        filter: `ticket=eq.${ticket}`,
      },
      (payload) => {
        if (!active) return;
        if (payload.eventType === "DELETE") {
          callback(null);
        } else if (payload.new && Object.keys(payload.new).length > 0) {
          callback(fromRow(payload.new));
        } else {
          load();
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error(`listenCase(${ticket}) subscription error:`, err);
      }
    });

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/**
 * Triggers a follow-up call.
 * Sets status to 'follow_up_due' and ringNow to true without altering other fields.
 *
 * @param {string} ticket
 * @returns {Promise<void>}
 */
export async function triggerFollowUp(ticket) {
  return updateCase(ticket, { status: "follow_up_due", ringNow: true });
}

/**
 * Clears the ringing state of a case.
 * Sets ringNow to false without altering other fields.
 *
 * @param {string} ticket
 * @returns {Promise<void>}
 */
export async function clearRing(ticket) {
  return updateCase(ticket, { ringNow: false });
}

/**
 * Seeds exactly 40 synthetic demo cases from lib/seed.js into public.cases.
 * Uses upsert on conflict 'ticket' to be safe for repeated execution.
 * Live cases (source='live') are never overwritten.
 *
 * @returns {Promise<number>} Number of cases inserted/upserted
 */
export async function seedDemoData() {
  const seedCases = buildSeedCases();
  const rows = seedCases.map(toRow);

  const { data, error } = await supabase
    .from("cases")
    .upsert(rows, { onConflict: "ticket" })
    .select();

  if (error) {
    throw new Error(`Failed to seed demo data: ${error.message || JSON.stringify(error)}`);
  }

  return data ? data.length : rows.length;
}

/**
 * Deletes ONLY synthetic cases where source='seed'.
 * Live cases (source='live') remain completely untouched.
 *
 * @returns {Promise<void>}
 */
export async function clearDemoData() {
  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("source", "seed");

  if (error) {
    throw new Error(`Failed to clear demo data: ${error.message || JSON.stringify(error)}`);
  }
}
