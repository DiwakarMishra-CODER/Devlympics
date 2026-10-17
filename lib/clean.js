const DOMAINS = ["farming", "schemes", "health", "other"];
const SEVERITIES = ["low", "medium", "high"];
const ICONS = ["water", "no_spray", "fertilizer", "visit_kvk", "visit_office", "document", "doctor", "call_112", "come_back", "wait"];
const SMS_PREFIX = "Saathi #TICKET:";
const CASE_FIELDS = ["name", "district", "domain", "subject", "problem", "problemKey", "severity", "escalate"];

const toKey = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const strOrNull = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

function parseJson(text) {
  const s = String(text ?? "").replace(/```(?:json)?/gi, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(s.slice(start, end + 1));
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : null;
  } catch {
    return null;
  }
}

function firstSentences(text, max = 2) {
  const parts = text.match(/[^.?!।]+[.?!।]*/g) || [text];
  return parts.slice(0, max).join("").trim();
}

export function parseAndClean(text, { mode, caseContext } = {}) {
  const raw = parseJson(text);
  if (!raw) return null;

  // 1. reply (follow-up prompt doesn't spell out the shape, so models sometimes rename it)
  const rawReply = [raw.reply, raw.response, raw.message, raw.text].find((v) => typeof v === "string" && v.trim());
  if (!rawReply) return null;
  const reply = firstSentences(rawReply.trim());

  // 2. case: on follow_up start from the saved case, then overlay the AI's non-null fields
  const base = mode === "follow_up" && caseContext && typeof caseContext === "object" ? caseContext : {};
  const ai = { ...(raw.case && typeof raw.case === "object" ? raw.case : {}) };
  if (typeof raw.escalate === "boolean" && typeof ai.escalate !== "boolean") ai.escalate = raw.escalate;
  const merged = {};
  for (const f of CASE_FIELDS) merged[f] = ai[f] ?? base[f] ?? null;

  const c = {
    name: strOrNull(merged.name),
    district: strOrNull(merged.district),
    domain: DOMAINS.includes(merged.domain) ? merged.domain : "other",
    subject: strOrNull(merged.subject),
    problem: strOrNull(merged.problem),
    problemKey: toKey(merged.problemKey) || toKey(merged.problem) || null,
    severity: SEVERITIES.includes(merged.severity) ? merged.severity : "low",
    escalate: typeof merged.escalate === "boolean" ? merged.escalate : false,
  };

  // 3. resolved
  const resolved = mode === "follow_up" && typeof raw.resolved === "boolean" ? raw.resolved : null;

  // 4. done
  let done = typeof raw.done === "boolean" ? raw.done : false;
  if (mode === "follow_up" && resolved !== null) done = true;

  // 5. advice
  const advice = typeof raw.advice === "string" ? raw.advice.trim() : "";

  // 6. smsText
  let sms = typeof raw.smsText === "string" ? raw.smsText.trim() : "";
  if (!sms.startsWith(SMS_PREFIX)) sms = `${SMS_PREFIX} ${sms}`.trim();
  const smsText = sms.slice(0, 160);

  // 7. icons
  const iconList = Array.isArray(raw.icons) ? raw.icons : [];
  const icons = [...new Set(iconList.filter((i) => ICONS.includes(i)))].slice(0, 3);
  if (!icons.length) icons.push("come_back");

  // 8. expertSummary
  let expertSummary = strOrNull(raw.expertSummary);
  if (!expertSummary && (c.escalate || resolved === false)) {
    const firstAdvice = (base.advice && String(base.advice)) || advice || "none recorded";
    expertSummary = [
      `Who: ${c.name || "Unknown caller"}, ${c.district || "district unknown"}.`,
      `Problem: ${c.problem || "unclear"}${c.subject ? ` (${c.subject})` : ""}, domain ${c.domain}, severity ${c.severity}.`,
      `Advice given: ${firstAdvice}`,
      resolved === false ? "Status: not solved after follow-up; needs expert contact." : "Status: escalated on first call; needs expert contact.",
    ].join("\n");
  }

  return { reply, done, case: c, advice, smsText, icons, resolved, expertSummary };
}
