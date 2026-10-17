import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageSquareText, Phone, Plus } from "lucide-react";
import { AlertGrid } from "@/components/landing/AlertGrid";
import { CallDemo } from "@/components/landing/CallDemo";
import { DayScroller, type DayStep } from "@/components/landing/DayScroller";
import { PriceCalculator } from "@/components/landing/PriceCalculator";
import {
  B2B_PLANS,
  B2C_EXTRA_PER_MIN,
  B2C_PLANS,
  BILLED_MIN_PER_PROBLEM,
  CALL_CENTRE_PER_CALL,
  OVERHEAD_PER_MIN,
  PRICE_PER_MIN,
  planMinutes,
  planPerMinute,
  planPrice,
  SARVAM,
  costPerMinute,
  inr,
} from "@/lib/pricing";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Logo } from "@/components/ui/Logo";

const sayings = [
  "My tomato leaves are turning yellow",
  "My pension stopped coming",
  "My cow won't eat",
  "My child has a fever",
  "I lost my ration card",
  "There's no rain this year",
  "My PM-Kisan money didn't come",
  "When is the next vaccine?",
];

const others: ReadonlyArray<{ who: string; example: string; problem: string; stamp: string; tilt: string }> = [
  {
    who: "Helplines",
    example: "like Kisan Call Centre",
    problem: "They answer once. Then they forget you.",
    stamp: "Forgets you",
    tilt: "-rotate-2",
  },
  {
    who: "AI chat apps",
    example: "like Kisan e-Mitra, Farmer.chat",
    problem: "You need a smartphone and the internet.",
    stamp: "Smartphone only",
    tilt: "rotate-1",
  },
  {
    who: "Farm shop apps",
    example: "like Plantix, AgroStar",
    problem: "The advice is free. But they sell sprays.",
    stamp: "Wants to sell",
    tilt: "-rotate-1",
  },
  {
    who: "Offices and agents",
    example: "like CSC centres",
    problem: "Long trip. Long line. Sometimes a fee.",
    stamp: "Too far",
    tilt: "rotate-2",
  },
  {
    who: "Press-1 phone lines",
    example: "IVR menus",
    problem: "Press 1. Press 4. Press 9. Then it hangs up.",
    stamp: "Confusing",
    tilt: "-rotate-2",
  },
];

const steps: readonly DayStep[] = [
  {
    day: "Step 1",
    title: "You call.",
    body: "Use any phone, even an old button phone. Your first minutes every month are free.",
    visual: <p className="font-grotesk text-4xl font-bold tracking-[-0.03em] text-forest-900 sm:text-5xl">1800-XXX-XXXX</p>,
  },
  {
    day: "Step 2",
    title: "You talk.",
    body: "Say your problem in your own words, in Hindi or English. No buttons. No forms.",
    visual: (
      <p className="rounded-2xl rounded-br-none border-2 border-forest-900 bg-saffron px-5 py-3 text-xl font-semibold text-forest-900 shadow-hard-sm">
        “My cow won&apos;t eat.”
      </p>
    ),
  },
  {
    day: "Step 3",
    title: "You get a message.",
    body: "A short SMS with your case number and what to do next. Show it to anyone.",
    visual: (
      <div className="w-full max-w-xs rounded-2xl border-2 border-forest-900 bg-[#CFE3C6] p-4 font-code text-sm leading-relaxed text-forest-900">
        <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] opacity-70">
          <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" /> SMS
        </p>
        Saathi #4721: Give fresh water. Call the vet if no change by tomorrow.
      </div>
    ),
  },
  {
    day: "Step 4",
    title: "Saathi calls you back.",
    body: "“Is it better?” Yes? Great. No? A real expert calls you, and you don't have to explain again.",
    visual: (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-full border-2 border-forest-900 bg-forest-50 px-4 py-2 font-grotesk text-lg font-bold text-forest-900">
          Better ✓
        </span>
        <span className="font-code text-xs text-muted">or</span>
        <span className="rounded-full border-2 border-forest-900 bg-saffron-50 px-4 py-2 font-grotesk text-lg font-bold text-forest-900">
          Expert calls →
        </span>
      </div>
    ),
  },
];

const nevers = [
  "Ask for your OTP or bank number",
  "Tell you how much medicine to take",
  "Sell you seeds, sprays or loans",
  "Ask for money on a call",
];

const faqs = [
  { q: "How much does it cost?", a: "10 minutes free every month. After that, ₹3.90 a minute, which is exactly what the call costs us. A whole problem, call back included, is about ₹19.50." },
  {
    q: "Isn't that expensive for an office?",
    a: "One solved problem costs about ₹19.50 with Saathi (5 minutes × ₹3.90). A call centre spends about ₹76 on the same problem (two calls at about ₹38). Everyone pays our cost, ₹3.90 a minute. No monthly fee, no extra fees.",
  },
  { q: "Do people need the internet?", a: "No. Saathi is a normal phone call. Any phone works, even a button phone." },
  { q: "Which languages?", a: "Hindi and simple English today. More Indian languages are next." },
  {
    q: "Is it safe?",
    a: "Saathi never asks for OTPs, bank or Aadhaar numbers. It never tells medicine doses. If it is not sure, it sends a real person.",
  },
  {
    q: "How do you know a problem is fixed?",
    a: "Saathi calls back after 3 days and asks. If it is not fixed, a real expert gets the case.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-x-clip bg-ivory text-ink">
      <ScrollProgress />

      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-40 border-b-2 border-forest-900 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="focus-ring rounded-2xl" aria-label="Saathi home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 font-code text-xs font-semibold uppercase tracking-[0.16em] text-forest-900 md:flex">
            <a href="#how" className="focus-ring rounded hover:text-saffron-700">How it works</a>
            <a href="#officers" className="focus-ring rounded hover:text-saffron-700">For officers</a>
            <a href="#pricing" className="focus-ring rounded hover:text-saffron-700">Pricing</a>
          </nav>
          <Link
            href="/phone"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-forest-900 bg-saffron px-4 font-grotesk text-sm font-bold text-forest-900 shadow-hard-sm transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Try a call <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24">
        <p className="font-code text-xs font-semibold uppercase tracking-[0.2em] text-forest-900/70">
          A helper on the phone · Free minutes every month
        </p>

        <h1 className="relative mt-5 font-grotesk text-[3.6rem] font-bold leading-[0.88] tracking-[-0.055em] text-forest-900 sm:text-[6.5rem] lg:text-[9.5rem]">
          Help that
          <br />
          calls you{" "}
          <span className="font-display font-medium italic tracking-[-0.03em] text-saffron-600">back.</span>
          <SpinBadge />
        </h1>

        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="max-w-md text-xl leading-relaxed text-ink-soft sm:text-2xl">
              Saathi is a kind voice on the phone. Tell it your problem. It helps you, sends you a message, and{" "}
              <mark className="bg-saffron-100 px-1 text-forest-900">calls you back in 3 days</mark> to check you are
              okay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/phone"
                className="focus-ring inline-flex min-h-14 items-center gap-2.5 rounded-full border-2 border-forest-900 bg-forest-900 px-7 font-grotesk text-lg font-bold text-ivory shadow-hard transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" aria-hidden="true" /> Try a call
              </Link>
              <Link
                href="/dashboard"
                className="focus-ring inline-flex min-h-14 items-center gap-2 rounded-full border-2 border-forest-900 bg-ivory px-7 font-grotesk text-lg font-bold text-forest-900 transition-colors duration-150 hover:bg-white"
              >
                Officer screen <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <CallDemo />
          </div>
        </div>
      </section>

      {/* ---------- Marquee ---------- */}
      <div className="overflow-hidden border-y-2 border-forest-900 bg-forest-900 py-5 text-ivory" aria-label="Things people call about">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-grotesk text-2xl font-bold tracking-[-0.02em] sm:text-4xl">
          {[...sayings, ...sayings].map((s, i) => (
            <span key={i} className="flex items-center gap-10" aria-hidden={i >= sayings.length}>
              “{s}”
              <span className="text-saffron" aria-hidden="true">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Chapter 1: the problem ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <Chapter n="01" label="The problem" />
        <h2 className="mt-6 max-w-5xl font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-forest-900 sm:text-7xl">
          Help moved into apps. <span className="text-forest-900/35">Many people didn&apos;t.</span>
        </h2>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[1.75rem] border-[3px] border-forest-900 bg-forest-900 md:grid-cols-3">
          {[
            { big: "25 crore", small: "people in India still use a simple button phone.", src: "IDC via Jio, 2023" },
            { big: "3 in 10", small: "women in India have a smartphone. For men it is about 5 in 10.", src: "GSMA, 2023" },
            { big: "4 in 10", small: "people manage to apply for government help they can get.", src: "Haqdarshak" },
          ].map((s) => (
            <div key={s.big} className="bg-ivory p-7 sm:p-9">
              <p className="font-grotesk text-6xl font-bold tracking-[-0.05em] text-forest-900 sm:text-7xl">{s.big}</p>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{s.small}</p>
              <p className="mt-6 font-code text-[0.65rem] uppercase tracking-[0.16em] text-muted">Source: {s.src}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-2xl text-xl leading-relaxed text-ink-soft">
          Think of a farmer with an old phone. Or a grandmother who can&apos;t read forms. They have nobody to ask, and
          when they do find help, nobody checks if it worked.
        </p>
      </section>

      {/* ---------- Chapter 2: other helpers ---------- */}
      <section className="border-y-2 border-forest-900 bg-sage-100 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Chapter n="02" label="What's out there" />
          <h2 className="mt-6 max-w-4xl font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-forest-900 sm:text-7xl">
            Other helpers try. They each miss something.
          </h2>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <article
                key={o.who}
                className={`relative rounded-[1.5rem] border-[3px] border-forest-900 bg-ivory p-6 shadow-hard transition-transform duration-200 hover:rotate-0 ${o.tilt}`}
              >
                <p className="font-grotesk text-2xl font-bold tracking-[-0.02em] text-forest-900">{o.who}</p>
                <p className="font-code text-xs text-muted">{o.example}</p>
                <p className="mt-6 text-lg leading-snug text-ink-soft">{o.problem}</p>
                <span className="mt-6 inline-block -rotate-6 rounded-md border-[3px] border-alert-500 px-3 py-1 font-code text-sm font-bold uppercase tracking-[0.14em] text-alert-500">
                  {o.stamp}
                </span>
              </article>
            ))}
            <article className="relative rotate-1 rounded-[1.5rem] border-[3px] border-forest-900 bg-forest-900 p-6 text-ivory shadow-hard transition-transform duration-200 hover:rotate-0">
              <p className="font-grotesk text-2xl font-bold tracking-[-0.02em] text-saffron">Saathi</p>
              <p className="font-code text-xs text-ivory/60">a phone call</p>
              <p className="mt-6 text-lg leading-snug text-ivory/90">
                Talks like a person. Works on any phone. Remembers you. Calls you back.
              </p>
              <span className="mt-6 inline-block -rotate-6 rounded-md border-[3px] border-saffron px-3 py-1 font-code text-sm font-bold uppercase tracking-[0.14em] text-saffron">
                Remembers you
              </span>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Chapter 3: how it works ---------- */}
      <section id="how" className="scroll-mt-16 bg-saffron-300 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Chapter n="03" label="How it works" />
          <h2 className="mt-6 max-w-4xl font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-forest-900 sm:text-7xl">
            Four steps. No app. No reading.
          </h2>
          <div className="mt-16">
            <DayScroller steps={steps} />
          </div>
        </div>
      </section>

      {/* ---------- Chapter 4: officers ---------- */}
      <section id="officers" className="scroll-mt-16 border-y-2 border-forest-900 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Chapter n="04" label="For officers" />
            <h2 className="mt-6 font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-forest-900 sm:text-6xl">
              See trouble before it spreads.
            </h2>
            <p className="mt-6 max-w-lg text-xl leading-relaxed text-ink-soft">
              Every call is a dot on your map. When 5 people in one place say the same thing in one week, your screen
              turns red.
            </p>
            <ul className="mt-8 space-y-3 text-lg text-forest-900">
              {["See every case, live", "Get a 3-line note on hard cases", "Spot pests, late pensions and fevers early"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-forest-900 bg-saffron">
                      <Plus className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {t}
                  </li>
                ),
              )}
            </ul>
            <Link
              href="/dashboard"
              className="focus-ring mt-10 inline-flex min-h-12 items-center gap-2 font-grotesk text-lg font-bold text-forest-900 underline decoration-saffron decoration-[3px] underline-offset-8 hover:decoration-forest-900"
            >
              Open the officer screen <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          <AlertGrid />
        </div>
      </section>

      {/* ---------- Chapter 5: promises ---------- */}
      <section className="bg-forest-900 py-24 text-ivory sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Chapter n="05" label="Our promise" dark />
          <h2 className="mt-6 font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-ivory sm:text-7xl">
            Saathi will never…
          </h2>
          <ul className="mt-14 divide-y-2 divide-ivory/15 border-y-2 border-ivory/15">
            {nevers.map((n, i) => (
              <li key={n} className="flex items-baseline gap-6 py-6 sm:py-8">
                <span className="font-code text-sm text-saffron">0{i + 1}</span>
                <span className="relative isolate font-grotesk text-3xl font-bold tracking-[-0.03em] text-ivory sm:text-5xl">
                  {n}
                  <span
                    className="absolute -left-1 top-[55%] -z-10 h-[0.18em] w-[calc(100%+0.5rem)] -translate-y-1/2 -rotate-1 bg-alert-500"
                    aria-hidden="true"
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-12 max-w-2xl rounded-2xl border-2 border-alert-500 bg-alert-500/10 p-6 text-xl leading-relaxed text-ivory">
            <strong className="font-grotesk text-alert-100">Big emergency?</strong> Chest pain, lots of bleeding, or
            someone won&apos;t wake up? Call <strong className="font-grotesk text-white">112</strong> now. Saathi will
            tell you the same thing.
          </p>
        </div>
      </section>

      {/* ---------- Chapter 6: pricing ---------- */}
      <section id="pricing" className="scroll-mt-16 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Chapter n="06" label="Pricing" />
          <div className="mt-6 grid items-end gap-8 lg:grid-cols-2">
            <h2 className="font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-forest-900 sm:text-7xl">
              Less than a cup
              <br />
              of <span className="font-display font-medium italic tracking-[-0.03em] text-saffron-600">chai.</span>
            </h2>
            <p className="max-w-md text-xl leading-relaxed text-ink-soft">
              One price for everyone: {inr(PRICE_PER_MIN, 2)} a minute, exactly what a call costs us. No monthly fee,
              no extra fees. Everyone gets 10 free minutes a month. One problem takes about {BILLED_MIN_PER_PROBLEM}{" "}
              minutes, call back included.
            </p>
          </div>

          {/* ---- B2B chart ---- */}
          <div className="mt-20">
            <p className="font-code text-xs font-semibold uppercase tracking-[0.18em] text-saffron-700">For offices · B2B</p>
            <h3 className="mt-2 font-grotesk text-4xl font-bold tracking-[-0.04em] text-forest-900">
              Pay per minute or monthly
            </h3>

            <div className="mt-8 grid gap-6 lg:mx-auto lg:max-w-5xl lg:grid-cols-2">
              {B2B_PLANS.map((p) => {
                const perMin = planPerMinute(p);
                const minutes = planMinutes(p);
                const unit = p.billing === "minute" ? "a minute · pay only for what you use" : "a month + GST";
                return (
                  <div
                    key={p.name}
                    className={`relative flex flex-col rounded-[1.75rem] border-[3px] border-forest-900 p-7 ${
                      p.featured ? "bg-forest-900 text-ivory shadow-hard lg:-translate-y-4" : "bg-white"
                    }`}
                  >
                    {p.badge ? (
                      <span className="absolute -top-4 right-6 rotate-3 rounded-full border-2 border-forest-900 bg-saffron px-3 py-1 font-code text-xs font-bold uppercase tracking-[0.14em] text-forest-900">
                        {p.badge}
                      </span>
                    ) : null}
                    <p className={`font-code text-xs font-semibold uppercase tracking-[0.18em] ${p.featured ? "text-saffron" : "text-saffron-700"}`}>
                      {p.name}
                    </p>
                    <p className={`mt-1 text-base ${p.featured ? "text-ivory/70" : "text-muted"}`}>{p.forWho}</p>
                    <p className={`mt-8 font-grotesk text-5xl font-bold tracking-[-0.05em] sm:text-6xl ${p.featured ? "text-ivory" : "text-forest-900"}`}>
                      {inr(planPrice(p), Number.isInteger(planPrice(p)) ? 0 : 2)}
                    </p>
                    <p className={p.featured ? "text-ivory/70" : "text-muted"}>{unit}</p>
                    <p className={`mt-3 rounded-full px-3 py-1 text-sm font-semibold ${p.featured ? "bg-ivory/10 text-ivory" : "bg-sage-100 text-forest-900"}`}>
                      {p.discount > 0
                        ? `${Math.round(p.discount * 100)}% off · ${inr(perMin, 2)} a minute instead of ${inr(PRICE_PER_MIN, 2)}`
                        : "No monthly fee · No extra fees"}
                    </p>

                    <dl className={`mt-6 grid grid-cols-2 gap-3 rounded-2xl p-4 text-sm ${p.featured ? "bg-ivory/10" : "bg-ivory"}`}>
                      <div>
                        <dt className={p.featured ? "text-ivory/60" : "text-muted"}>Minutes</dt>
                        <dd className="font-grotesk text-lg font-bold">
                          {minutes ? `${minutes.toLocaleString("en-IN")} / mo` : "As you go"}
                        </dd>
                      </div>
                      <div>
                        <dt className={p.featured ? "text-ivory/60" : "text-muted"}>One problem</dt>
                        <dd className="font-grotesk text-lg font-bold">≈ {inr(perMin * BILLED_MIN_PER_PROBLEM, 2)}</dd>
                      </div>
                      <div>
                        <dt className={p.featured ? "text-ivory/60" : "text-muted"}>Per minute</dt>
                        <dd className="font-grotesk text-lg font-bold">{inr(perMin, 2)}</dd>
                      </div>
                      <div>
                        <dt className={p.featured ? "text-ivory/60" : "text-muted"}>Talk at once</dt>
                        <dd className="font-grotesk text-lg font-bold">{p.parallelCalls.replace(" at once", "")}</dd>
                      </div>
                    </dl>

                    <ul className="mt-6 flex-1 space-y-3">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex gap-3">
                          <span className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${p.featured ? "bg-saffron" : "bg-forest-900"}`} />
                          <span className={p.featured ? "text-ivory/90" : "text-ink-soft"}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={p.billing === "minute" ? "/phone" : "/dashboard"}
                      className={`focus-ring mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 font-grotesk font-bold transition-transform duration-150 hover:-translate-y-0.5 ${
                        p.featured ? "border-saffron bg-saffron text-forest-900" : "border-forest-900 bg-ivory text-forest-900"
                      }`}
                    >
                      {p.billing === "minute" ? "Try a call" : "See the demo"}{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
              Same {inr(PRICE_PER_MIN, 2)} minute on every plan, GST extra. The monthly plan is paid in advance, which
              lets us buy Sarvam&apos;s volume rate ({inr(SARVAM.agentPerMin.business, 2)} instead of{" "}
              {inr(SARVAM.agentPerMin.growth, 2)}) and brings our cost down to about{" "}
              {inr(SARVAM.agentPerMin.business + SARVAM.telephonyPerMin + OVERHEAD_PER_MIN, 2)} a minute. Partner and CSR
              funds cover the small gap.
            </p>
          </div>

          {/* ---- B2C chart ---- */}
          <div className="mt-24">
            <p className="font-code text-xs font-semibold uppercase tracking-[0.18em] text-saffron-700">For people · B2C</p>
            <div className="mt-2 grid items-end gap-4 lg:grid-cols-2">
              <h3 className="font-grotesk text-4xl font-bold tracking-[-0.04em] text-forest-900">
                Recharge like a phone pack
              </h3>
              <p className="max-w-md text-lg leading-relaxed text-ink-soft">
                10 minutes free every month. After that, the same {inr(PRICE_PER_MIN, 2)} a minute that offices pay. Recharge at any
                shop or with UPI. Saathi never asks for money on a call.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {B2C_PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`flex flex-col rounded-[1.5rem] border-[3px] border-forest-900 p-6 ${p.featured ? "bg-saffron-300" : "bg-white"}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-grotesk text-xl font-bold tracking-[-0.02em] text-forest-900">{p.name}</p>
                    <p className="text-sm text-ink-soft" lang="hi">{p.hindi}</p>
                  </div>
                  <p className="mt-5 font-grotesk text-5xl font-bold tracking-[-0.05em] text-forest-900">
                    {p.price === 0 ? "₹0" : inr(p.price, Number.isInteger(p.price) ? 0 : 2)}
                  </p>
                  <p className="text-ink-soft">
                    <strong className="text-forest-900">{p.minutes} minutes</strong> · {p.validity}
                  </p>
                  <p className="text-sm text-muted">{p.problems}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-ink-soft">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-900" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Every minute is {inr(B2C_EXTRA_PER_MIN, 2)}, exactly our cost: no profit and no fees. GST as per law. Free
              minutes are paid for by partner offices and CSR funds.
            </p>
          </div>

          {/* ---- Where the money goes + calculator ---- */}
          <div className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
            <div>
              <h3 className="font-grotesk text-4xl font-bold tracking-[-0.04em] text-forest-900">Where each rupee goes</h3>
              <p className="mt-4 text-xl leading-relaxed text-ink-soft">
                One minute of a Saathi call costs us about{" "}
                <strong className="text-forest-900">{inr(costPerMinute("growth"), 2)}</strong>. A person answering phones
                costs about <strong className="text-forest-900">{inr(CALL_CENTRE_PER_CALL)} a call</strong>.
              </p>
              <dl className="mt-8 space-y-4">
                {[
                  { label: "Sarvam voice agent", value: SARVAM.agentPerMin.growth, cls: "bg-forest-900" },
                  { label: "Phone line", value: SARVAM.telephonyPerMin, cls: "bg-saffron" },
                  { label: "SMS, cloud, backup AI", value: OVERHEAD_PER_MIN, cls: "bg-sage-400" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between font-code text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      <dt>{row.label}</dt>
                      <dd>{inr(row.value, 2)} / min</dd>
                    </div>
                    <div className="mt-2 h-5 rounded-full border-2 border-forest-900 bg-white" aria-hidden="true">
                      <div
                        className={`h-full rounded-full ${row.cls}`}
                        style={{ width: `${(row.value / costPerMinute("growth")) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm leading-relaxed text-muted">
                Voice by Sarvam Voice Agents: {inr(SARVAM.agentPerMin.business, 2)}–{inr(SARVAM.agentPerMin.payg, 2)} a
                minute by plan, phone line {inr(SARVAM.telephonyPerMin, 2)} a minute, GST extra. Source:
                docs.sarvam.ai/voice-agents/pricing, checked 17 Oct 2026. SMS and cloud are our estimate.
              </p>
            </div>
            <PriceCalculator />
          </div>

          <div className="mt-20 rounded-[1.75rem] border-[3px] border-dashed border-forest-900 p-7 sm:p-9">
            <p className="font-grotesk text-2xl font-bold tracking-[-0.02em] text-forest-900">
              How we will never make money
            </p>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink-soft">
              No ads. No selling seeds or sprays. No selling anyone&apos;s name or number. Saathi earns only from call
              minutes, so the only thing it cares about is solving the problem quickly.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="border-t-2 border-forest-900 bg-white py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="font-grotesk text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-forest-900 sm:text-6xl">
            Questions
          </h2>
          <div className="divide-y-2 divide-forest-900 border-y-2 border-forest-900">
            {faqs.map((f) => (
              <details key={f.q} className="group py-2">
                <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded font-grotesk text-xl font-bold text-forest-900 sm:text-2xl [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus className="h-6 w-6 shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
                </summary>
                <p className="pb-5 pr-10 text-lg leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Finale ---------- */}
      <section className="overflow-hidden bg-forest-900 pt-24 text-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="font-grotesk text-4xl font-bold tracking-[-0.04em] text-ivory sm:text-6xl">
            Call. Talk. <span className="text-saffron">Get help.</span>
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/phone"
              className="focus-ring inline-flex min-h-14 items-center gap-2.5 rounded-full border-2 border-saffron bg-saffron px-7 font-grotesk text-lg font-bold text-forest-900 transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Phone className="h-5 w-5" aria-hidden="true" /> Try a call
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-14 items-center gap-2 rounded-full border-2 border-ivory/40 px-7 font-grotesk text-lg font-bold text-ivory transition-colors duration-150 hover:bg-ivory/10"
            >
              Officer screen <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-16 max-w-2xl font-code text-xs leading-relaxed text-ivory/50">
            Demo for Devlympics · Shunya 2026. The phone number is a placeholder. No real calls or SMS are sent. Prices
            and costs are mock numbers.
          </p>
        </div>
        <p
          className="mt-10 select-none whitespace-nowrap text-center font-grotesk text-[27vw] font-bold leading-[0.75] tracking-[-0.07em] text-ivory/[0.07]"
          aria-hidden="true"
        >
          saathi
        </p>
      </section>
    </main>
  );
}

function Chapter({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <p className={`flex items-center gap-3 font-code text-xs font-semibold uppercase tracking-[0.2em] ${dark ? "text-ivory/60" : "text-forest-900/60"}`}>
      <span
        className={`grid h-8 min-w-8 place-items-center rounded-full border-2 px-2 ${
          dark ? "border-saffron text-saffron" : "border-forest-900 text-forest-900"
        }`}
      >
        {n}
      </span>
      {label}
    </p>
  );
}

/** Slowly spinning round sticker next to the headline. */
function SpinBadge() {
  return (
    <span
      className="absolute -top-6 right-0 hidden h-36 w-36 place-items-center rounded-full border-[3px] border-forest-900 bg-saffron shadow-hard sm:grid lg:right-8 lg:top-2 lg:h-44 lg:w-44"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ animation: "spin 18s linear infinite" }}>
        <defs>
          <path id="badge-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text className="fill-forest-900 font-code text-[8px] font-bold uppercase" letterSpacing="1.6">
          <textPath href="#badge-circle">Free minutes · Any phone · No app · </textPath>
        </text>
      </svg>
      <Phone className="h-10 w-10 text-forest-900" strokeWidth={2.25} />
    </span>
  );
}
