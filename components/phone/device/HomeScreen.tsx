"use client";

import { useEffect, useState } from "react";
import {
  Calculator,
  Camera,
  Clock,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  Settings,
  Sprout,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "./AppIcon";
import type { PhoneTab } from "@/hooks/usePhoneDevice";

type AppAction = "saathi" | "phone" | "contacts" | "notice";

interface HomeApp {
  id: string;
  label: string;
  icon: LucideIcon;
  tile: string;
  action: AppAction;
  tab?: PhoneTab;
}

const GRID: readonly HomeApp[] = [
  { id: "saathi", label: "Saathi", icon: Sprout, tile: "bg-forest", action: "saathi" },
  { id: "messages", label: "Messages", icon: MessageCircle, tile: "bg-saffron-600", action: "notice" },
  { id: "contacts", label: "Contacts", icon: Users, tile: "bg-forest-400", action: "contacts" },
  { id: "settings", label: "Settings", icon: Settings, tile: "bg-muted", action: "notice" },
  { id: "camera", label: "Camera", icon: Camera, tile: "bg-ink", action: "notice" },
  { id: "clock", label: "Clock", icon: Clock, tile: "bg-forest-600", action: "notice" },
  { id: "calculator", label: "Calculator", icon: Calculator, tile: "bg-saffron", action: "notice" },
  { id: "gallery", label: "Gallery", icon: ImageIcon, tile: "bg-alert", action: "notice" },
];

const DOCK: readonly HomeApp[] = [
  { id: "phone", label: "Phone", icon: Phone, tile: "bg-forest-500", action: "phone", tab: "keypad" },
  { id: "dock-messages", label: "Messages", icon: MessageCircle, tile: "bg-saffron-600", action: "notice" },
  { id: "dock-contacts", label: "Contacts", icon: Users, tile: "bg-forest-400", action: "contacts" },
  { id: "dock-camera", label: "Camera", icon: Camera, tile: "bg-ink", action: "notice" },
];

export interface HomeScreenProps {
  onOpenPhone: (tab: PhoneTab) => void;
  onOpenSaathi: () => void;
  onNotice: (message: string) => void;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

/** Native-feeling home screen: clock widget, app grid, and a dock. */
export function HomeScreen({ onOpenPhone, onOpenSaathi, onNotice }: HomeScreenProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(timer);
  }, []);

  const handle = (app: HomeApp): void => {
    switch (app.action) {
      case "phone":
        onOpenPhone(app.tab ?? "keypad");
        return;
      case "contacts":
        onOpenPhone("contacts");
        return;
      case "saathi":
        onOpenSaathi();
        return;
      default:
        onNotice(`${app.label} isn't part of this demo.`);
    }
  };

  return (
    <div className="device-wallpaper relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="px-6 pb-2 pt-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          Demo build
        </p>
        <p className="mt-5 font-display text-5xl font-semibold leading-none text-white drop-shadow-sm">
          {now ? formatTime(now) : "\u00a0"}
        </p>
        <p className="mt-1.5 text-sm font-medium text-white/80">
          {now ? now.toLocaleDateString("en-IN", DATE_FORMAT) : "\u00a0"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-x-4 gap-y-5 px-5">
        {GRID.map((app) => (
          <AppIcon
            key={app.id}
            icon={app.icon}
            label={app.label}
            tileClassName={app.tile}
            onClick={() => handle(app)}
          />
        ))}
      </div>

      <div className="mt-auto px-5 pb-4 pt-6">
        <div className="flex items-center justify-around rounded-[2rem] border border-white/15 bg-white/10 p-3 backdrop-blur">
          {DOCK.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => handle(app)}
              aria-label={app.label}
              className="focus-ring grid h-[3.25rem] w-[3.25rem] place-items-center rounded-[1.15rem] text-white shadow-soft transition-transform duration-150 active:scale-95"
            >
              <span className={`grid h-full w-full place-items-center rounded-[1.15rem] ${app.tile}`}>
                <app.icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[0.65rem] text-white/60">
          Tap Phone to call Saathi. Other apps are decorative.
        </p>
      </div>
    </div>
  );
}
