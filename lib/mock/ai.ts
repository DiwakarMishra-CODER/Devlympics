import type {
  AppLanguage,
  AskRequest,
  AskResponse,
  ChatMessage,
  DraftCase,
  Domain,
  IconKey,
  Severity,
} from "../types";

/**
 * Rule-based stand-in for `POST /api/saathi`. It returns the exact response
 * shape from the contract so the phone UI never needs to change when the real
 * model is wired in. It intentionally never produces a dose, diagnosis, or
 * legal advice.
 */

const DISTRICT_HINTS = [
  "meerut",
  "barabanki",
  "sitapur",
  "lucknow",
  "gorakhpur",
  "varanasi",
  "kanpur",
  "prayagraj",
  "bareilly",
  "jhansi",
  "agra",
  "aligarh",
  "moradabad",
];

const EMERGENCY_WORDS = [
  "chest pain",
  "seene mein dard",
  "seene me dard",
  "saans",
  "breathing",
  "behosh",
  "unconscious",
  "khoon",
  "bleeding",
  "zeher",
  "poison",
  "accident",
];

const HEALTH_WORDS = [
  "bukhar",
  "fever",
  "dard",
  "dawa",
  "medicine",
  "tablet",
  "tab",
  "doctor",
  "health",
  "bimar",
  "ill",
  "pet",
  "sir",
  "kamar",
];

const TOMATO_WORDS = ["tamatar", "tomato"];
const YELLOW_WORDS = ["peele", "peela", "peeli", "yellow"];

const PENSION_WORDS = ["pension", "penshan"];
const PENSION_MISSING_WORDS = [
  "nahi aayi",
  "nahi mili",
  "nahi aya",
  "not received",
  "delayed",
  "late",
  "teen mahine",
  "3 months",
  "band",
  "pending",
];

const SCHEME_WORDS = [
  "yojana",
  "scheme",
  "ration",
  "rashan",
  "kisan",
  "scholarship",
  "aadhaar",
  "aadhar",
  "card",
  "certificate",
  "daftar",
  "office",
];

interface Category {
  domain: Domain;
  subject: string | null;
  problem: string;
  problemKey: string;
  severity: Severity;
  escalate: boolean;
  advice: string;
  icons: IconKey[];
}

function matchAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => text.includes(word));
}

function combineUserText(history: readonly ChatMessage[]): string {
  return history
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ")
    .toLowerCase();
}

function lastUserContent(history: readonly ChatMessage[]): string {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (message && message.role === "user") return message.content;
  }
  return "";
}

function countUserTurns(history: readonly ChatMessage[]): number {
  return history.filter((message) => message.role === "user").length;
}

function extractDistrict(text: string): string | null {
  for (const district of DISTRICT_HINTS) {
    if (text.includes(district)) {
      return district.charAt(0).toUpperCase() + district.slice(1);
    }
  }
  return null;
}

function extractName(text: string): string | null {
  const match = text.match(/(?:mera naam|meri naam|mein|main)\s+([a-z\u0900-\u097F]+)/i);
  if (!match) return null;
  const value = match[1];
  if (!value) return null;
  const cleaned = value.trim();
  if (!cleaned || DISTRICT_HINTS.includes(cleaned.toLowerCase())) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function detectCategory(text: string): Category {
  if (matchAny(text, EMERGENCY_WORDS)) {
    return {
      domain: "health",
      subject: null,
      problem: "possible emergency",
      problemKey: "emergency",
      severity: "high",
      escalate: true,
      advice: "Possible emergency — directed to call 112 and go to the nearest PHC.",
      icons: ["call_112", "doctor"],
    };
  }

  if (matchAny(text, HEALTH_WORDS)) {
    return {
      domain: "health",
      subject: null,
      problem: "health concern",
      problemKey: "health_concern",
      severity: "medium",
      escalate: false,
      advice: "No diagnosis given — visit the nearest PHC or ASHA worker.",
      icons: ["doctor", "come_back"],
    };
  }

  if (matchAny(text, TOMATO_WORDS) || (matchAny(text, YELLOW_WORDS) && matchAny(text, ["patta", "patte", "leaf", "leaves", "fasal", "crop"]))) {
    return {
      domain: "farming",
      subject: "tomato",
      problem: "yellow leaves",
      problemKey: "yellow_leaves",
      severity: "medium",
      escalate: false,
      advice: "Likely nitrogen deficiency; confirm fertiliser dose with KVK before applying.",
      icons: ["fertilizer", "visit_kvk", "come_back"],
    };
  }

  if (matchAny(text, PENSION_WORDS)) {
    const delayed = matchAny(text, PENSION_MISSING_WORDS);
    return {
      domain: "schemes",
      subject: "old-age pension",
      problem: delayed ? "pension not received" : "pension query",
      problemKey: delayed ? "pension_not_received" : "pension_query",
      severity: delayed ? "medium" : "low",
      escalate: false,
      advice: "Visit the block pension office with the passbook and last payment receipt.",
      icons: ["visit_office", "document", "come_back"],
    };
  }

  if (matchAny(text, SCHEME_WORDS)) {
    return {
      domain: "schemes",
      subject: null,
      problem: "government scheme issue",
      problemKey: "scheme_issue",
      severity: "medium",
      escalate: false,
      advice: "Visit the concerned office with the required documents and keep a receipt.",
      icons: ["visit_office", "document", "come_back"],
    };
  }

  if (matchAny(text, ["fasal", "kheti", "crop", "keet", "pest", "paani", "sinchai", "irrigation", "khaad", "wheat", "gehun", "dhan", "paddy", "bajra"])) {
    return {
      domain: "farming",
      subject: null,
      problem: "crop problem",
      problemKey: "crop_problem",
      severity: "medium",
      escalate: false,
      advice: "Confirm the problem with KVK before any spray or fertiliser.",
      icons: ["visit_kvk", "come_back"],
    };
  }

  return {
    domain: "other",
    subject: null,
    problem: "general query",
    problemKey: "general_query",
    severity: "low",
    escalate: false,
    advice: "Visit the concerned office with the relevant documents and this ticket.",
    icons: ["visit_office", "come_back"],
  };
}

function smsFor(category: Category, language: AppLanguage): string {
  const tail = language === "hi-IN" ? "Hum 3 din baad call karenge." : "We will call back in 3 days.";
  const english: Record<string, string> = {
    emergency: "Saathi #TICKET: Possible emergency. Call 112 right away.",
    health_concern: "Saathi #TICKET: Health concern noted. Visit a PHC or ASHA worker.",
    yellow_leaves: "Saathi #TICKET: Yellow leaves on tomato. Ask KVK about the fertiliser dose.",
    pension_not_received: "Saathi #TICKET: Pension problem noted. Visit the office with your passbook.",
    pension_query: "Saathi #TICKET: Pension query noted. Visit the office for details.",
    scheme_issue: "Saathi #TICKET: Scheme problem noted. Visit the office with your papers.",
    crop_problem: "Saathi #TICKET: Crop problem noted. Get advice from KVK.",
    general_query: "Saathi #TICKET: Your problem was noted. Visit the right office.",
  };
  const hinglish: Record<string, string> = {
    emergency: "Saathi #TICKET: Emergency jaise lakshan. Turant 112 par call karein.",
    health_concern: "Saathi #TICKET: Sehat ki baat note ki. PHC ya ASHA worker se milein.",
    yellow_leaves: "Saathi #TICKET: Tamatar ke patte peele. KVK se khaad ki matra poochhein.",
    pension_not_received: "Saathi #TICKET: Pension samasya note ki. Passbook lekar daftar jaayein.",
    pension_query: "Saathi #TICKET: Pension ke baare mein jaankari chahiye. Daftar jaayein.",
    scheme_issue: "Saathi #TICKET: Yojana ki samasya note ki. Kagaz lekar daftar jaayein.",
    crop_problem: "Saathi #TICKET: Fasal ki samasya note ki. KVK se salah lein.",
    general_query: "Saathi #TICKET: Aapki samasya note ki gayi. Sahi daftar jaayein.",
  };
  const map = language === "hi-IN" ? hinglish : english;
  const body = map[category.problemKey] ?? "Saathi #TICKET: Your problem was noted.";
  return `${body} ${tail}`.slice(0, 160);
}

function expertSummaryFor(
  category: Category,
  name: string | null,
  district: string | null,
): string {
  const who = [name ?? "Unknown caller", district ?? "district unknown"].join(", ");
  return [
    `${who}.`,
    `Reported: ${category.problem}.`,
    `Saathi gave no dose/diagnosis; advised: ${category.advice}`,
    "Needs a human expert to take over.",
  ].join("\n");
}

function englishReply(category: Category, name: string | null): string {
  const greeting = name ? `Thank you, ${name}. ` : "";
  return `${greeting}${category.advice}`;
}

function hindiFinalReply(category: Category, name: string | null, district: string | null): string {
  const who = name ? `${name} ji, ` : "";
  const place = district ? `${district} se. ` : "";
  if (category.problemKey === "emergency") {
    return `${who}turant 112 par call karein aur najdiki PHC jaayein. Der na karein.`;
  }
  if (category.problemKey === "yellow_leaves") {
    return `Samajh gaya ${who}${place}patton ka peela hona khaad ki kami ho sakti hai, KVK se khaad ki matra poochh lijiye.`;
  }
  if (category.problemKey === "pension_not_received") {
    return `Samajh gaya ${who}${place}pension ruk gayi hai. Passbook aur pichhli receipt lekar block daftar jaayein.`;
  }
  return `${who}${category.advice}`;
}

function questionReply(category: Category, language: AppLanguage, haveDistrict: boolean, haveName: boolean): string {
  if (language === "en-IN") {
    if (!haveDistrict) return "Understood. Which district are you calling from?";
    if (!haveName) return "Thank you. May I know your name?";
    return englishReply(category, null);
  }
  if (!haveDistrict) return "Samajh gaya. Aap kis zile se hain?";
  if (!haveName) return "Dhanyavaad. Aapka naam kya hai?";
  return hindiFinalReply(category, null, null);
}

function firstCallReply(request: AskRequest): AskResponse {
  const text = combineUserText(request.history);
  const name = extractName(text);
  const district = extractDistrict(text);
  const category = detectCategory(text);
  const userTurns = countUserTurns(request.history);

  const enough = category.escalate || Boolean(district && name) || userTurns >= 2;

  const reply = enough
    ? request.language === "en-IN"
      ? englishReply(category, name)
      : hindiFinalReply(category, name, district)
    : questionReply(category, request.language, Boolean(district), Boolean(name));

  const draft: DraftCase = {
    name,
    district,
    domain: category.domain,
    subject: category.subject,
    problem: category.problem,
    problemKey: category.problemKey,
    severity: category.severity,
    escalate: category.escalate,
  };

  return {
    reply,
    done: enough,
    case: draft,
    advice: category.advice,
    smsText: smsFor(category, request.language),
    icons: category.icons,
    resolved: null,
    expertSummary: category.escalate ? expertSummaryFor(category, name, district) : null,
  };
}

function followUpGreeting(language: AppLanguage, context: AskRequest["caseContext"]): string {
  const name = context?.name ? `${context.name} ji` : "";
  const problem = context?.problem ?? "aapki samasya";
  if (language === "en-IN") {
    return `${name ? name + ", " : ""}this is Saathi calling back. Did your problem with ${problem} get solved?`;
  }
  return `${name ? name + ", " : ""}main Saathi bol raha hoon. Kya ${problem} ka hal ho gaya?`;
}

function followUpReply(request: AskRequest): AskResponse {
  const context = request.caseContext;
  const base: DraftCase = context
    ? {
        name: context.name,
        district: context.district,
        domain: context.domain,
        subject: context.subject,
        problem: context.problem,
        problemKey: context.problemKey,
        severity: context.severity,
        escalate: false,
      }
    : {
        name: null,
        district: null,
        domain: "other",
        subject: null,
        problem: "follow-up",
        problemKey: "follow_up",
        severity: "medium",
        escalate: false,
      };

  const advice = context?.advice ?? "";

  if (countUserTurns(request.history) === 0) {
    return {
      reply: followUpGreeting(request.language, context),
      done: false,
      case: base,
      advice,
      smsText: "",
      icons: [],
      resolved: null,
      expertSummary: null,
    };
  }

  const last = lastUserContent(request.history).toLowerCase();
  // Negation must win: "theek nahi hua" contains "theek" but is unresolved.
  const negative = matchAny(last, [
    "nahi",
    "nahin",
    "nhi",
    "not ",
    "no ",
    "abhi bhi",
    "pending",
    "problem hai",
    "hal nahi",
  ]);
  const positive = matchAny(last, [
    "haan",
    "ho gaya",
    "hal ho",
    "mil gaya",
    "theek",
    "thik",
    "solved",
    "yes",
    "ok",
  ]);

  if (positive && !negative) {
    return {
      reply:
        request.language === "en-IN"
          ? "That is good news. I am glad it worked out. Take care."
          : "Bahut accha laga sunkar. Khush rahiye, apna dhyan rakhiye.",
      done: true,
      case: base,
      advice,
      smsText: "",
      icons: [],
      resolved: true,
      expertSummary: null,
    };
  }

  if (negative) {
    return {
      reply:
        request.language === "en-IN"
          ? "I am sorry it is still not solved. An expert will contact you soon."
          : "Mujhe dukh hai ki samasya abhi bhi hai. Ek expert aapse jald sampark karega.",
      done: true,
      case: { ...base, escalate: true },
      advice,
      smsText: "",
      icons: [],
      resolved: false,
      expertSummary: `Follow-up: problem not solved.\nProblem: ${context?.problem ?? "unknown"}.\nFirst-call advice: ${advice || "n/a"}.\nNeeds a human expert now.`,
    };
  }

  return {
    reply:
      request.language === "en-IN"
        ? "Sorry, I did not follow. Did the problem get solved, yes or no?"
        : "Maaf kijiye, samajh nahi paaya. Samasya hal hui ya nahi?",
    done: false,
    case: base,
    advice,
    smsText: "",
    icons: [],
    resolved: null,
    expertSummary: null,
  };
}

export function mockAskSaathi(request: AskRequest): AskResponse {
  return request.mode === "follow_up" ? followUpReply(request) : firstCallReply(request);
}
