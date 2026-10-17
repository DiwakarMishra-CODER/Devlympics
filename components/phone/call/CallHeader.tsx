import { cn } from "@/lib/cn";

export interface CallHeaderProps {
  label: string;
  number: string;
  status: string;
  className?: string;
}

/** Compact caller strip shown at the top of an active call. */
export function CallHeader({ label, number, status, className }: CallHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 bg-forest px-5 py-3 text-ivory",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert-500 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-alert-500" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{label}</p>
          <p className="truncate text-[0.7rem] font-medium text-ivory/70">{number}</p>
        </div>
      </div>
      <p className="shrink-0 text-right text-xs font-semibold text-saffron">{status}</p>
    </header>
  );
}
