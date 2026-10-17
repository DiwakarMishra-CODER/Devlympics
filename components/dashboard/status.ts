import { CircleCheck, CircleDot, PhoneCall, Siren, type LucideIcon } from "lucide-react";
import type { CaseStatus } from "@/lib/types";

/** One plain-language name per status, with an icon so colour is never the only signal. */
export const STATUS_META: Record<CaseStatus, { label: string; hint: string; icon: LucideIcon; tone: string }> = {
  open: {
    label: "Open",
    hint: "Advice given, call back in 3 days",
    icon: CircleDot,
    tone: "text-forest-700 bg-sage-100",
  },
  follow_up_due: {
    label: "Call due",
    hint: "Follow-up call is due now",
    icon: PhoneCall,
    tone: "text-saffron-700 bg-saffron-100",
  },
  escalated: {
    label: "Needs expert",
    hint: "Saathi could not solve it",
    icon: Siren,
    tone: "text-alert-700 bg-alert-50",
  },
  resolved: {
    label: "Resolved",
    hint: "Caller said it is fixed",
    icon: CircleCheck,
    tone: "text-ink-soft bg-ivory-200",
  },
};

export const STATUS_ORDER: readonly CaseStatus[] = ["escalated", "follow_up_due", "open", "resolved"];
