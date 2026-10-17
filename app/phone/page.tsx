import Link from "next/link";
import { ArrowRight, Smartphone, Grid3x3 } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { KeypadPhoneView } from "@/components/phone/feature/KeypadPhoneView";
import { SmartphoneView } from "@/components/phone/smart/SmartphoneView";

type Device = "smart" | "keypad";

const OPTIONS: ReadonlyArray<{ device: Device; title: string; hindi: string; body: string; icon: typeof Smartphone }> = [
  {
    device: "keypad",
    title: "Keypad phone",
    hindi: "बटन वाला फ़ोन",
    body: "A simple button phone, like most of our callers use. Press keys to dial, talk, and hear Saathi.",
    icon: Grid3x3,
  },
  {
    device: "smart",
    title: "Smartphone",
    hindi: "स्मार्टफ़ोन",
    body: "A touch-screen phone with a dialer, contacts and the Saathi app for looking up a ticket.",
    icon: Smartphone,
  },
];

/** "Try a call" lands here: pick the phone, then the call runs on that phone. */
export default async function PhonePage({ searchParams }: { searchParams: Promise<{ device?: string }> }) {
  const { device } = await searchParams;
  if (device === "keypad") return <KeypadPhoneView />;
  if (device === "smart") return <SmartphoneView />;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-forest-900 px-4 py-16 text-ivory">
      <BackLink tone="light" className="absolute left-4 top-4 z-10" />

      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-saffron">Try a call</p>
      <h1 className="mt-3 text-center font-display text-4xl font-medium leading-tight text-ivory sm:text-5xl">
        Which phone do you want to call from?
      </h1>
      <p className="mt-3 text-center text-ivory/70">आप किस फ़ोन से कॉल करना चाहते हैं?</p>

      <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ device: value, title, hindi, body, icon: OptionIcon }) => (
          <Link
            key={value}
            href={`/phone?device=${value}`}
            className="focus-ring group flex flex-col rounded-[1.75rem] border border-white/15 bg-white/5 p-6 transition-colors duration-150 hover:border-saffron hover:bg-white/10"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-saffron text-forest-900">
              <OptionIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-5 font-display text-2xl font-semibold">{title}</span>
            <span className="text-sm text-ivory/60" lang="hi">{hindi}</span>
            <span className="mt-3 flex-1 text-sm leading-relaxed text-ivory/80">{body}</span>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-saffron">
              Start <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-ivory/50">Use Chrome and allow the microphone. No real call or SMS is sent.</p>
    </main>
  );
}
