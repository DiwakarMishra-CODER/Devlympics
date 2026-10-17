"use client";

import { Phone } from "lucide-react";
import { DEMO_CONTACTS, formatPhoneNumber } from "@/lib/phone/demo";

export interface ContactsListProps {
  onCall: (number: string, callable: boolean) => void;
}

/** Contacts tab: a small address book; only the Saathi line is callable. */
export function ContactsList({ onCall }: ContactsListProps) {
  return (
    <ul className="flex-1 divide-y divide-line overflow-y-auto">
      {DEMO_CONTACTS.map((contact) => {
        const initial = contact.name.charAt(0).toUpperCase();
        return (
          <li key={contact.id}>
            <button
              type="button"
              onClick={() => onCall(contact.number, contact.callable)}
              className="focus-ring flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ivory-50"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-sm font-semibold text-ivory">
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-forest-900">
                  {contact.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {contact.note} · {formatPhoneNumber(contact.number)}
                </span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-600">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
