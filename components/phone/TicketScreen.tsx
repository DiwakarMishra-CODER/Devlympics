"use client";

import { CheckCircle2, Home, MessageSquareText, PhoneCall, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconCaseCard } from "./IconCaseCard";
import { domainLabel } from "@/lib/labels";
import type { AppLanguage, Case } from "@/lib/types";
import type { TicketVariant } from "@/hooks/usePhoneCall";

export interface TicketScreenProps {
  item: Case;
  variant: TicketVariant;
  language: AppLanguage;
  onHome: () => void;
  /** Present for a saved case, so the person can start a follow-up call. */
  onFollowUp?: (item: Case) => void;
}

/**
 * Case completion / case detail. The ticket and status are shown as fact; the
 * AI advice sits in its own labelled box so the two are never confused.
 */
export function TicketScreen({
  item,
  variant,
  language,
  onHome,
  onFollowUp,
}: TicketScreenProps) {
  const hindi = language === "hi-IN";
  const sms = item.smsText.replaceAll("#TICKET", item.ticket);

  const rows: Array<{ label: string; value: string }> = [];
  if (item.name) rows.push({ label: hindi ? "नाम" : "Name", value: item.name });
  if (item.district) rows.push({ label: hindi ? "ज़िला" : "District", value: item.district });
  rows.push({ label: hindi ? "विषय" : "Topic", value: domainLabel(item.domain, language) });
  rows.push({ label: hindi ? "समस्या" : "Problem", value: item.problem });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="bg-forest px-5 pb-7 pt-6 text-ivory">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
          <Icon icon={CheckCircle2} size="sm" />
          {variant === "new"
            ? hindi
              ? "केस दर्ज हो गया"
              : "Case registered"
            : hindi
              ? "आपका पुराना केस"
              : "Your saved case"}
        </p>
        <p className="mt-3 text-center text-sm font-medium text-ivory/80">
          {hindi ? "आपका टिकट नंबर" : "Your ticket number"}
        </p>
        <p
          className="mt-1 flex items-center justify-center gap-2 font-display text-5xl font-semibold tracking-[0.12em] text-ivory"
          aria-label={`${hindi ? "टिकट नंबर" : "Ticket number"} ${item.ticket}`}
        >
          {item.ticket}
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-ivory/80">
          {hindi
            ? "इस नंबर को याद रखें या लिख लें।"
            : "Remember or write down this number."}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-forest-700">
            <Icon icon={Ticket} size="sm" />
            {item.ticket}
          </span>
          <span className="text-xs font-semibold text-muted">
            {hindi ? "स्थिति नीचे दी है" : "Status shown below"}
          </span>
        </div>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {hindi ? "आपकी समस्या" : "Your case"}
          </p>
          <dl className="mt-3 space-y-2.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm font-medium text-muted">{row.label}</dt>
                <dd className="text-right text-sm font-semibold text-forest-900 [overflow-wrap:anywhere]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <IconCaseCard icons={item.icons} language={language} />

        {item.advice ? (
          <Callout tone="advice" title={hindi ? "साथी की सलाह" : "Saathi's advice"}>
            {item.advice}
          </Callout>
        ) : null}

        {sms ? (
          <Card className="bg-ivory-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              <Icon icon={MessageSquareText} size="sm" />
              {hindi ? "भेजा गया SMS (नमूना)" : "SMS sent (sample)"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
              {sms}
            </p>
          </Card>
        ) : null}

        <Callout tone="info" title={hindi ? "आगे क्या होगा" : "What happens next"}>
          {hindi
            ? "साथी 3 दिन बाद आपको फिर कॉल करेगा और पूछेगा कि समस्या हल हुई या नहीं। न हुआ हो तो केस किसी विशेषज्ञ को भेजा जाएगा।"
            : "Saathi will call you again in 3 days to ask whether the problem is solved. If not, the case is passed to a human expert."}
        </Callout>

        <div className="mt-auto space-y-2.5 pt-2">
          {variant === "saved" && onFollowUp ? (
            <Button
              variant="primary"
              size="xl"
              fullWidth
              className="gap-2"
              onClick={() => onFollowUp(item)}
            >
              <Icon icon={PhoneCall} size="lg" />
              {hindi ? "इस केस पर बात करें" : "Talk about this case"}
            </Button>
          ) : null}
          <Button
            variant={variant === "saved" ? "outline" : "primary"}
            size="xl"
            fullWidth
            className="gap-2"
            onClick={onHome}
          >
            <Icon icon={Home} size="lg" />
            {hindi ? "मुख्य पेज पर जाएँ" : "Back to home"}
          </Button>
        </div>

        <p className="text-center text-[0.7rem] leading-snug text-muted">
          {hindi
            ? "यह एक डेमो है — असली कॉल या SMS नहीं भेजा जाता।"
            : "This is a demo — no real call or SMS is sent."}
        </p>
      </div>
    </div>
  );
}
