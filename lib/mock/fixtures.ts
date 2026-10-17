import type {
  AppLanguage,
  Case,
  CaseStatus,
  ConversationMessage,
  Domain,
  IconKey,
  NewTurn,
  Severity,
  Ticket,
} from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

interface SeedPerson {
  name: string;
  district: string;
  status: CaseStatus;
  /** How many days ago the case was created (keep within the alert window). */
  daysAgo: number;
  severity?: Severity;
  ticket?: Ticket;
  turns?: NewTurn[];
  expertSummary?: string | null;
  language?: AppLanguage;
}

interface SeedCluster {
  domain: Domain;
  subject: string | null;
  problem: string;
  problemKey: string;
  severity: Severity;
  advice: string;
  /** SMS template. `#TICKET` is replaced with the real ticket. */
  sms: string;
  icons: IconKey[];
  people: SeedPerson[];
}

const ADVICE_BY_DOMAIN: Record<Domain, string> = {
  farming: "Follow KVK guidance; confirm any fertiliser or spray dose with KVK first.",
  schemes: "Visit the concerned office with the required documents and keep a receipt.",
  health: "No diagnosis given — visit the nearest PHC or ASHA worker for a check-up.",
  other: "Visit the concerned office with the relevant documents and a copy of this ticket.",
};

const ICONS_BY_DOMAIN: Record<Domain, IconKey[]> = {
  farming: ["visit_kvk", "come_back"],
  schemes: ["visit_office", "document", "come_back"],
  health: ["doctor", "come_back"],
  other: ["visit_office", "come_back"],
};

const SMS_BY_DOMAIN: Record<Domain, string> = {
  farming: "Saathi #TICKET: Your farming problem was noted. Follow KVK advice. We will call back in 3 days.",
  schemes: "Saathi #TICKET: Your scheme problem was noted. Visit the office with your papers. We will call back in 3 days.",
  health: "Saathi #TICKET: Your health concern was noted. Please visit a PHC or ASHA worker. We will call back in 3 days.",
  other: "Saathi #TICKET: Your problem was noted. Visit the right office. We will call back in 3 days.",
};

const TO_MIXED: Array<{
  domain: Domain;
  subject: string | null;
  problem: string;
  problemKey: string;
  severity: Severity;
  status: CaseStatus;
  name: string;
  district: string;
  daysAgo: number;
  expertSummary?: string | null;
}> = [
  { domain: "farming", subject: "sugarcane", problem: "stem borer", problemKey: "stem_borer", severity: "medium", status: "open", name: "Arjun Singh", district: "Gorakhpur", daysAgo: 1 },
  { domain: "farming", subject: "mustard", problem: "aphid attack", problemKey: "aphid_attack", severity: "medium", status: "open", name: "Devki Nandan", district: "Bareilly", daysAgo: 2 },
  { domain: "farming", subject: "potato", problem: "late blight", problemKey: "late_blight", severity: "high", status: "escalated", name: "Suresh Yadav", district: "Kanpur", daysAgo: 3, expertSummary: "Potato grower, Kanpur. Late blight spreading across the plot after rain. Advised to isolate affected plants; needs KVK field visit urgently." },
  { domain: "farming", subject: "wheat", problem: "irrigation delay", problemKey: "irrigation_delay", severity: "low", status: "resolved", name: "Meena Kumari", district: "Jhansi", daysAgo: 4 },
  { domain: "farming", subject: "paddy", problem: "yellow stem borer", problemKey: "yellow_stem_borer", severity: "medium", status: "follow_up_due", name: "Rakesh Verma", district: "Varanasi", daysAgo: 1 },
  { domain: "farming", subject: "tomato", problem: "fruit rot", problemKey: "fruit_rot", severity: "medium", status: "resolved", name: "Pooja Devi", district: "Meerut", daysAgo: 5 },
  { domain: "schemes", subject: "PM-Kisan", problem: "installment not received", problemKey: "pmkisan_not_received", severity: "medium", status: "open", name: "Mahesh Chand", district: "Lucknow", daysAgo: 2 },
  { domain: "schemes", subject: "ration card", problem: "card not made", problemKey: "ration_card_pending", severity: "medium", status: "follow_up_due", name: "Usha Devi", district: "Prayagraj", daysAgo: 1 },
  { domain: "schemes", subject: "scholarship", problem: "payment pending", problemKey: "scholarship_pending", severity: "low", status: "resolved", name: "Anita Kumari", district: "Gorakhpur", daysAgo: 5 },
  { domain: "schemes", subject: "widow pension", problem: "application rejected", problemKey: "widow_pension_rejected", severity: "high", status: "escalated", name: "Savitri Devi", district: "Barabanki", daysAgo: 3, expertSummary: "Widow pension applicant, Barabanki. Application rejected without a stated reason; documents were complete. Needs a block-level officer review." },
  { domain: "schemes", subject: "old-age pension", problem: "wrong bank account", problemKey: "pension_bank_mismatch", severity: "medium", status: "resolved", name: "Chhote Lal", district: "Sitapur", daysAgo: 4 },
  { domain: "schemes", subject: "Ayushman card", problem: "card not received", problemKey: "ayushman_pending", severity: "low", status: "open", name: "Jagdish Prasad", district: "Bareilly", daysAgo: 2 },
  { domain: "health", subject: "eye", problem: "blurred vision", problemKey: "blurred_vision", severity: "medium", status: "open", name: "Ram Autar", district: "Kanpur", daysAgo: 1 },
  { domain: "health", subject: "fever", problem: "high fever", problemKey: "high_fever", severity: "medium", status: "resolved", name: "Kanti Devi", district: "Varanasi", daysAgo: 3 },
  { domain: "health", subject: "chest pain", problem: "chest pain", problemKey: "chest_pain", severity: "high", status: "escalated", name: "Bihari Lal", district: "Lucknow", daysAgo: 0, expertSummary: "Reported chest pain. Saathi gave no diagnosis and directed the caller to emergency help (112) and the nearest PHC. Needs urgent human follow-up." },
  { domain: "health", subject: "pregnancy", problem: "checkup needed", problemKey: "pregnancy_checkup", severity: "medium", status: "follow_up_due", name: "Radha Devi", district: "Prayagraj", daysAgo: 2 },
  { domain: "other", subject: "electricity", problem: "transformer fault", problemKey: "transformer_fault", severity: "medium", status: "open", name: "Nand Kishore", district: "Jhansi", daysAgo: 1 },
  { domain: "other", subject: "water", problem: "no water supply", problemKey: "no_water_supply", severity: "medium", status: "follow_up_due", name: "Sarita Devi", district: "Gorakhpur", daysAgo: 2 },
  { domain: "other", subject: "land", problem: "land record error", problemKey: "land_record_error", severity: "high", status: "escalated", name: "Bansi Lal", district: "Meerut", daysAgo: 4, expertSummary: "Land record shows the wrong owner name. Saathi gave no legal advice; pointed to the tehsil office. Needs a land-record clerk to verify." },
  { domain: "other", subject: "road", problem: "road repair request", problemKey: "road_repair", severity: "low", status: "resolved", name: "Om Prakash", district: "Sitapur", daysAgo: 5 },
  { domain: "schemes", subject: "bank", problem: "pension not credited", problemKey: "pension_not_credited", severity: "medium", status: "resolved", name: "Munni Devi", district: "Barabanki", daysAgo: 3 },
  { domain: "schemes", subject: "certificate", problem: "income certificate delay", problemKey: "income_certificate_delay", severity: "low", status: "resolved", name: "Deepak Kumar", district: "Varanasi", daysAgo: 4 },
  { domain: "schemes", subject: "gas connection", problem: "connection pending", problemKey: "gas_connection_pending", severity: "low", status: "open", name: "Kaushalya Devi", district: "Bareilly", daysAgo: 2 },
  { domain: "other", subject: null, problem: "general query", problemKey: "general_query", severity: "low", status: "resolved", name: "Rameshwar", district: "Jhansi", daysAgo: 5 },
];

const CLUSTERS: SeedCluster[] = [
  {
    domain: "farming",
    subject: "tomato",
    problem: "yellow leaves",
    problemKey: "yellow_leaves",
    severity: "medium",
    advice: "Likely nitrogen deficiency; confirm fertiliser dose with KVK before applying.",
    sms: "Saathi #TICKET: Yellow leaves on tomato. Ask KVK about the fertiliser dose. We will call back in 3 days.",
    icons: ["fertilizer", "visit_kvk", "come_back"],
    people: [
      {
        name: "Ramesh",
        district: "Meerut",
        status: "follow_up_due",
        daysAgo: 0,
        ticket: "4721",
        turns: [
          { role: "user", text: "My tomato leaves are turning yellow" },
          { role: "saathi", text: "Understood. Yellow leaves can mean a fertiliser shortage. Which district are you in?" },
          { role: "user", text: "Meerut" },
          { role: "saathi", text: "Thank you. Ask KVK about the fertiliser dose. We will call back in 3 days." },
        ],
      },
      { name: "Sunil Kumar", district: "Meerut", status: "open", daysAgo: 0 },
      { name: "Geeta Devi", district: "Meerut", status: "open", daysAgo: 1 },
      { name: "Mohan Lal", district: "Meerut", status: "follow_up_due", daysAgo: 2 },
      { name: "Hari Om", district: "Meerut", status: "open", daysAgo: 3 },
      { name: "Rajesh Yadav", district: "Meerut", status: "follow_up_due", daysAgo: 4 },
      {
        name: "Vikram Singh",
        district: "Meerut",
        status: "escalated",
        daysAgo: 5,
        expertSummary: "Tomato farmer, Meerut. Yellowing spread to most of the field. Advised KVK visit; farmer reports no improvement. Needs a KVK field officer.",
      },
    ],
  },
  {
    domain: "schemes",
    subject: "old-age pension",
    problem: "pension not received for 3 months",
    problemKey: "pension_not_received",
    severity: "medium",
    advice: "Visit the block pension office with the passbook and last payment receipt.",
    sms: "Saathi #TICKET: Pension not received for three months. Visit the office with your passbook. We will call back in 3 days.",
    icons: ["visit_office", "document", "come_back"],
    people: [
      {
        name: "Sunita Devi",
        district: "Barabanki",
        status: "follow_up_due",
        daysAgo: 0,
        ticket: "5138",
        turns: [
          { role: "user", text: "My pension has not arrived for three months" },
          { role: "saathi", text: "Don't worry. Please tell me your name and district." },
          { role: "user", text: "Sunita Devi, Barabanki" },
          { role: "saathi", text: "Thank you. Take your bank passbook and last receipt to the block pension office. We will call back in 3 days." },
        ],
      },
      { name: "Kamla Devi", district: "Barabanki", status: "open", daysAgo: 1 },
      { name: "Ram Prasad", district: "Barabanki", status: "follow_up_due", daysAgo: 2 },
      { name: "Shanti Devi", district: "Barabanki", status: "open", daysAgo: 3 },
      { name: "Bhola Nath", district: "Barabanki", status: "follow_up_due", daysAgo: 4 },
      {
        name: "Nirmala Devi",
        district: "Barabanki",
        status: "escalated",
        daysAgo: 5,
        expertSummary: "Old-age pension not credited for 3 months, Barabanki. Bank and office both deny responsibility. Needs a district-level pension officer.",
      },
    ],
  },
  {
    domain: "farming",
    subject: "wheat",
    problem: "pest attack",
    problemKey: "pest_attack",
    severity: "medium",
    advice: "Confirm the pest and any spray with KVK before acting.",
    sms: "Saathi #TICKET: Pest attack on wheat. Get it checked at KVK. We will call back in 3 days.",
    icons: ["no_spray", "visit_kvk", "come_back"],
    people: [
      { name: "Shyam Bihari", district: "Sitapur", status: "open", daysAgo: 1 },
      { name: "Puttu Lal", district: "Sitapur", status: "follow_up_due", daysAgo: 2 },
      { name: "Anil Kumar", district: "Sitapur", status: "open", daysAgo: 3 },
    ],
  },
];

function buildTurns(
  person: SeedPerson,
  createdAt: Date,
  ticket: Ticket,
): ConversationMessage[] {
  if (!person.turns) return [];
  return person.turns.map((turn, index) => ({
    id: `${ticket}_t${index}`,
    role: turn.role,
    text: turn.text,
    at: new Date(createdAt.getTime() + index * 30 * 1000).toISOString(),
  }));
}

/**
 * Builds the realistic demo dataset: ~40 cases over the last 7 days, including
 * a 7-case Meerut tomato/yellow-leaves cluster and a 6-case Barabanki
 * old-age-pension cluster (both cross the early-warning threshold), a
 * below-threshold Sitapur cluster, and 24 mixed background cases.
 */
export function buildDemoCases(now: Date = new Date()): Case[] {
  const used = new Set<Ticket>();
  let cursor = 4200;

  const allocate = (preferred?: Ticket): Ticket => {
    if (preferred && !used.has(preferred)) {
      used.add(preferred);
      return preferred;
    }
    while (used.has(String(cursor))) cursor += 1;
    const ticket = String(cursor);
    used.add(ticket);
    cursor += 1;
    return ticket;
  };

  const push = (base: SeedCluster | null, person: SeedPerson, override?: Partial<Case>): void => {
    const domain = override?.domain ?? base?.domain ?? "other";
    const createdAt = new Date(now.getTime() - person.daysAgo * DAY_MS - 3 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + 45 * 60 * 1000);
    const ticket = allocate(person.ticket);

    cases.push({
      ticket,
      name: person.name,
      language: person.language ?? "en-IN",
      domain,
      district: person.district,
      subject: override?.subject ?? base?.subject ?? null,
      problem: override?.problem ?? base?.problem ?? "general query",
      problemKey: override?.problemKey ?? base?.problemKey ?? "general_query",
      severity: person.severity ?? override?.severity ?? base?.severity ?? "medium",
      status: person.status,
      advice: override?.advice ?? base?.advice ?? ADVICE_BY_DOMAIN[domain],
      smsText: (override?.smsText ?? base?.sms ?? SMS_BY_DOMAIN[domain]).replace("#TICKET", ticket),
      icons: override?.icons ?? base?.icons ?? ICONS_BY_DOMAIN[domain],
      turns: buildTurns(person, createdAt, ticket),
      expertSummary: person.expertSummary ?? null,
      ringNow: false,
      followUpAt: new Date(createdAt.getTime() + 3 * DAY_MS).toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      source: "seed",
    });
  };

  const cases: Case[] = [];

  for (const cluster of CLUSTERS) {
    for (const person of cluster.people) push(cluster, person);
  }

  for (const entry of TO_MIXED) {
    push(null, {
      name: entry.name,
      district: entry.district,
      status: entry.status,
      daysAgo: entry.daysAgo,
      severity: entry.severity,
      expertSummary: entry.expertSummary ?? null,
    }, {
      domain: entry.domain,
      subject: entry.subject,
      problem: entry.problem,
      problemKey: entry.problemKey,
      advice: ADVICE_BY_DOMAIN[entry.domain],
      icons: ICONS_BY_DOMAIN[entry.domain],
      smsText: SMS_BY_DOMAIN[entry.domain],
    });
  }

  return cases;
}
