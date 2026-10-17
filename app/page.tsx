import Link from "next/link";
import {
  ArrowRight,
  FileText,
  HeartPulse,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

const entryPoints: ReadonlyArray<{
  href: string;
  label: string;
  english: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: "/phone",
    label: "Phone experience",
    english: "Person's side",
    description: "Voice-first, one big action per screen.",
    icon: Smartphone,
  },
  {
    href: "/dashboard",
    label: "Expert console",
    english: "Officials' side",
    description: "Live cases, follow-ups, and early-warning alerts.",
    icon: LayoutDashboard,
  },
];

const domains: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: Sprout, label: "Farming" },
  { icon: FileText, label: "Schemes" },
  { icon: HeartPulse, label: "Health" },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-ivory">
      <div className="mx-auto flex max-w-5xl flex-col px-6 py-12 sm:py-20">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <Badge tone="saffron">Devlympics · Shunya 2026</Badge>
        </header>

        <section className="mt-16 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron-700">
            Bridge the Gap
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-forest-900 sm:text-5xl">
            Every problem, together.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Saathi is a voice-first AI case worker. People speak in their own
            language, Saathi answers out loud, opens a case, follows up — and
            warns officials when a problem is spreading.
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted">
            <Icon
              icon={ShieldCheck}
              size="sm"
              className="mt-0.5 shrink-0 text-forest-600"
            />
            No diagnosis, no doses, no legal advice — Saathi points to the right
            human.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {entryPoints.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="focus-ring group rounded-2xl"
            >
              <Card className="flex h-full flex-col gap-5 p-6 transition-shadow group-hover:shadow-lift">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700">
                  <Icon icon={entry.icon} size="lg" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {entry.english}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-forest-900">
                    {entry.label}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{entry.description}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                  Open
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Card>
            </Link>
          ))}
        </section>

        <section className="mt-10 flex flex-wrap gap-2.5">
          {domains.map((domain) => (
            <span
              key={domain.label}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft"
            >
              <Icon icon={domain.icon} size="sm" className="text-forest-600" />
              {domain.label}
            </span>
          ))}
        </section>

        <footer className="mt-16 border-t border-line pt-6 text-xs text-muted">
          Demo build. The phone experience and expert console run on a typed
          in-memory layer behind <span className="font-mono">lib/services</span>;
          swapping in the real backend needs no UI changes. No real calls or SMS
          are sent.
        </footer>
      </div>
    </main>
  );
}
