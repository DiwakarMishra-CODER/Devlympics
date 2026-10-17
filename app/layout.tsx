import type { Metadata, Viewport } from "next";
import { Fraunces, Mukta } from "next/font/google";
import "./globals.css";

/**
 * Mukta is a humanist typeface with Devanagari coverage kept available for
 * future localisation. Fraunces carries the display/heading voice for Latin
 * text. The interface currently renders in English only.
 */
const bodyFont = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Saathi — every problem, together",
    template: "%s · Saathi",
  },
  description:
    "Saathi is a voice-first AI case worker for people who cannot easily read, use a smartphone, or get online. It listens, answers out loud, opens a case, follows up, and warns officials when a problem spreads.",
  applicationName: "Saathi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173F32",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body className="min-h-dvh bg-ivory text-ink">{children}</body>
    </html>
  );
}
