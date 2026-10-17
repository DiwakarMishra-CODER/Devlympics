import { iconSpec } from "@/lib/icons";
import type { AppLanguage, IconKey } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface IconCaseCardProps {
  icons: readonly IconKey[];
  language?: AppLanguage;
  className?: string;
}

/** Pictorial, low-literacy summary card: emoji + short label per action. */
export function IconCaseCard({ icons, language = "en-IN", className }: IconCaseCardProps) {
  if (icons.length === 0) return null;

  return (
    <ul className={cn("grid grid-cols-2 gap-2.5", className)}>
      {icons.map((key) => {
        const spec = iconSpec(key);
        return (
          <li
            key={key}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-3"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sage-100 text-2xl"
              role="img"
              aria-label={language === "hi-IN" ? spec.labelHi : spec.labelEn}
            >
              {spec.emoji}
            </span>
            <span className="text-sm font-semibold leading-snug text-forest-900">
              {language === "hi-IN" ? spec.labelHi : spec.labelEn}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
