export async function askSaathi(request) {
  const res = await fetch("/api/saathi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`askSaathi failed: ${res.status}`);
  return res.json();
}

// Turns an askSaathi response into fields for createCase / updateCase in lib/db.js.
// The DB has no "escalate" column: escalation and resolution are stored in status.
export function toCaseFields(ai) {
  const { escalate, ...caseFields } = ai.case || {};
  let status;
  if (ai.resolved === true) status = "resolved";
  else if (escalate || ai.resolved === false) status = "escalated";
  return { ...caseFields, status, advice: ai.advice, smsText: ai.smsText, icons: ai.icons, expertSummary: ai.expertSummary ?? undefined };
}
