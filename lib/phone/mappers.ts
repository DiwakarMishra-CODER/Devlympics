import type {
  AppLanguage,
  AskResponse,
  Case,
  CaseContext,
  CaseStatus,
  ChatMessage,
  ConversationMessage,
  CreateCaseInput,
  MessageRole,
} from "../types";

let seq = 0;

/** Builds a display turn with a stable id. */
export function createMessage(role: MessageRole, text: string): ConversationMessage {
  seq += 1;
  return { id: `turn_${seq}`, role, text, at: new Date().toISOString() };
}

/** Stored turns → the shape the AI request expects (`assistant`, `content`). */
export function toChatHistory(messages: readonly ConversationMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    role: message.role === "saathi" ? "assistant" : "user",
    content: message.text,
  }));
}

/** Display turns → turns to persist on the case. */
export function toNewTurns(
  messages: readonly ConversationMessage[],
): Array<{ role: MessageRole; text: string; at: string }> {
  return messages.map((message) => ({ role: message.role, text: message.text, at: message.at }));
}

export function caseContextFromCase(item: Case): CaseContext {
  return {
    name: item.name,
    domain: item.domain,
    subject: item.subject,
    problem: item.problem,
    problemKey: item.problemKey,
    severity: item.severity,
    advice: item.advice,
    district: item.district,
  };
}

export function responseToStatus(response: AskResponse): CaseStatus {
  if (response.case.escalate) return "escalated";
  return "open";
}

/** Maps an AI response onto a new case record, filling defaults. */
export function responseToCreateInput(
  response: AskResponse,
  language: AppLanguage,
  turns: readonly ConversationMessage[],
): CreateCaseInput {
  return {
    name: response.case.name,
    language,
    domain: response.case.domain,
    district: response.case.district,
    subject: response.case.subject,
    problem: response.case.problem,
    problemKey: response.case.problemKey,
    severity: response.case.severity,
    status: responseToStatus(response),
    advice: response.advice,
    smsText: response.smsText,
    icons: response.icons,
    turns: toNewTurns(turns),
    expertSummary: response.expertSummary,
    ringNow: false,
    source: "live",
  };
}

/** The SMS line shown to the user, with the real ticket substituted in. */
export function buildSms(item: Case): string {
  return item.smsText.replaceAll("#TICKET", item.ticket);
}

export function greetingFor(language: AppLanguage): string {
  return language === "hi-IN"
    ? "नमस्ते, मैं साथी हूँ। बताइए, आपकी क्या समस्या है?"
    : "Namaste, I am Saathi. Tell me, what is your problem?";
}

export function followUpOpening(language: AppLanguage, item: Case): string {
  const name = item.name ?? "";
  const problem = item.problem;
  return language === "hi-IN"
    ? `${name ? name + " जी, " : ""}मैं साथी बोल रहा हूँ। क्या ${problem} का हल हो गया?`
    : `${name ? name + ", " : ""}this is Saathi calling back. Did your problem with ${problem} get solved?`;
}

export function fallbackLine(language: AppLanguage): string {
  return language === "hi-IN"
    ? "माफ़ कीजिए, अभी बात नहीं समझ आई। एक बार फिर बोलिए।"
    : "Sorry, I could not understand. Please say that again.";
}

export function networkErrorLine(language: AppLanguage): string {
  return language === "hi-IN"
    ? "माफ़ कीजिए, अभी साथी से बात नहीं हो पाई। नीचे लिखकर भेज सकते हैं।"
    : "Sorry, I could not reach Saathi just now. You can type your message below.";
}

export function listeningPromptFor(language: AppLanguage): string {
  return language === "hi-IN" ? "बोलिए, मैं सुन रहा हूँ…" : "Speak, I am listening…";
}

export function processingLabelFor(language: AppLanguage): string {
  return language === "hi-IN" ? "साथी सोच रहा है…" : "Saathi is thinking…";
}

const DIGIT_WORDS_HI: Readonly<Record<string, string>> = {
  "0": "शून्य",
  "1": "एक",
  "2": "दो",
  "3": "तीन",
  "4": "चार",
  "5": "पाँच",
  "6": "छह",
  "7": "सात",
  "8": "आठ",
  "9": "नौ",
};

/** "4721" → "चार, सात, दो, एक" so the ticket is unmistakable when spoken. */
export function ticketSpeech(ticket: string, language: AppLanguage): string {
  const digits = ticket.split("");
  if (language === "en-IN") {
    return `Your ticket number is ${digits.join(", ")}.`;
  }
  const words = digits.map((digit) => DIGIT_WORDS_HI[digit] ?? digit).join(", ");
  return `आपका टिकट नंबर है, ${words}।`;
}

/** Asked after the caller goes quiet following an answer. */
export function anythingMoreLine(language: AppLanguage): string {
  return language === "hi-IN" ? "क्या आप कुछ और पूछना चाहते हैं?" : "Do you want to ask anything more?";
}

export function goAheadLine(language: AppLanguage): string {
  return language === "hi-IN" ? "ठीक है, बताइए।" : "Okay, please go ahead.";
}

/** Ticket read out twice so the caller can write it down before the call ends. */
export function closingLine(ticket: string, language: AppLanguage): string {
  const first = ticketSpeech(ticket, language);
  if (language === "en-IN") {
    return `${first} I repeat, ${ticket.split("").join(", ")}. Please note it down for the future. Thank you!`;
  }
  const words = ticket.split("").map((digit) => DIGIT_WORDS_HI[digit] ?? digit).join(", ");
  return `${first} दोबारा, ${words}। इसे आगे के लिए लिख लीजिए। धन्यवाद!`;
}

export type YesNo = "yes" | "no" | "other";

/**
 * Reads a short spoken answer to "anything more?". Longer sentences count as
 * "other" so a real follow-up question is never swallowed as yes/no.
 */
export function classifyYesNo(text: string): YesNo {
  const value = text.trim().toLowerCase();
  if (!value || value.split(/\s+/).length > 4) return "other";
  if (/\b(no|nope|nothing|nahi|nahin|nai|bas)\b|नहीं|नही|बस|कुछ नहीं/.test(value)) return "no";
  if (/\b(yes|yeah|yep|haan|han|haa|ha|ji)\b|हाँ|हां|जी/.test(value)) return "yes";
  return "other";
}

export interface TicketLookupProblem {
  message: string;
}

/** Normalises raw keypad/typed input into a 4-digit ticket, or explains why not. */
export function normaliseTicket(raw: string): { ticket: string } | TicketLookupProblem {
  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 0) return { message: "Enter your ticket number." };
  if (digits.length !== 4) return { message: "A ticket number has four digits." };
  return { ticket: digits };
}
