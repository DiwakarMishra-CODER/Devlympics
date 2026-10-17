"use client";

import { Grid3x3, History, Home, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialer } from "./Dialer";
import { RecentsList } from "./RecentsList";
import { ContactsList } from "./ContactsList";
import type { PhoneTab } from "@/hooks/usePhoneDevice";
import type { RecentCall } from "@/lib/phone/recents";
import { cn } from "@/lib/cn";

interface TabSpec {
  id: PhoneTab;
  label: string;
  icon: LucideIcon;
}

const TABS: readonly TabSpec[] = [
  { id: "keypad", label: "Keypad", icon: Grid3x3 },
  { id: "recents", label: "Recents", icon: History },
  { id: "contacts", label: "Contacts", icon: Users },
];

export interface PhoneAppProps {
  tab: PhoneTab;
  dialed: string;
  numberError: string | null;
  recents: readonly RecentCall[];
  onSelectTab: (tab: PhoneTab) => void;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onCall: () => void;
  onCallContact: (number: string, callable: boolean) => void;
  onHome: () => void;
}

/** The native Phone app: Keypad, Recents and Contacts behind one tab bar. */
export function PhoneApp({
  tab,
  dialed,
  numberError,
  recents,
  onSelectTab,
  onKey,
  onBackspace,
  onCall,
  onCallContact,
  onHome,
}: PhoneAppProps) {
  const title = tab === "keypad" ? "Phone" : tab === "recents" ? "Recents" : "Contacts";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ivory">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <button
          type="button"
          onClick={onHome}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-forest-700"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Home
        </button>
        <p className="font-display text-base font-semibold text-forest-900">{title}</p>
        <span aria-hidden="true" className="w-[4.5rem]" />
      </header>

      {tab === "keypad" ? (
        <Dialer
          dialed={dialed}
          numberError={numberError}
          onKey={onKey}
          onBackspace={onBackspace}
          onCall={onCall}
        />
      ) : null}

      {tab === "recents" ? (
        <RecentsList recents={recents} onCall={onCallContact} />
      ) : null}

      {tab === "contacts" ? <ContactsList onCall={onCallContact} /> : null}

      <nav className="flex shrink-0 items-stretch border-t border-line bg-white">
        {TABS.map((tabSpec) => {
          const active = tabSpec.id === tab;
          return (
            <button
              key={tabSpec.id}
              type="button"
              onClick={() => onSelectTab(tabSpec.id)}
              aria-pressed={active}
              className={cn(
                "focus-ring flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold transition-colors",
                active ? "text-forest-700" : "text-muted hover:text-forest-700",
              )}
            >
              <tabSpec.icon className="h-5 w-5" aria-hidden="true" />
              {tabSpec.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
