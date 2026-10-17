import type { IconKey } from "./types";

export interface IconSpec {
  key: IconKey;
  emoji: string;
  /** Short Hindi label shown to the user. */
  labelHi: string;
  labelEn: string;
}

/** Icon keys from the project brief (section 4.6). */
export const ICON_SPECS: Record<IconKey, IconSpec> = {
  water: { key: "water", emoji: "💧", labelHi: "पानी दें", labelEn: "Give water" },
  no_spray: { key: "no_spray", emoji: "🚫", labelHi: "स्प्रे न करें", labelEn: "Do not spray" },
  fertilizer: { key: "fertilizer", emoji: "🌱", labelHi: "खाद", labelEn: "Fertilizer" },
  visit_kvk: { key: "visit_kvk", emoji: "🧑‍🌾", labelHi: "KVK जाएँ", labelEn: "Visit KVK" },
  visit_office: { key: "visit_office", emoji: "🏢", labelHi: "दफ़्तर जाएँ", labelEn: "Visit office" },
  document: { key: "document", emoji: "📄", labelHi: "कागज़ साथ लाएँ", labelEn: "Bring papers" },
  doctor: { key: "doctor", emoji: "🏥", labelHi: "डॉक्टर को दिखाएँ", labelEn: "See a doctor" },
  call_112: { key: "call_112", emoji: "🚨", labelHi: "112 पर कॉल करें", labelEn: "Call 112" },
  come_back: { key: "come_back", emoji: "📅", labelHi: "3 दिन बाद बात", labelEn: "Talk in 3 days" },
  wait: { key: "wait", emoji: "⏳", labelHi: "इंतज़ार करें", labelEn: "Wait" },
};

export function iconSpec(key: IconKey): IconSpec {
  return ICON_SPECS[key];
}
