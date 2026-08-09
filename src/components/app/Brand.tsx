import { cn } from "@/lib/utils";

/**
 * Brand mark: three descending strata with a taproot — "deeper life" as depth
 * and rootedness. Deliberately not a cross/dove/stained-glass motif.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeOpacity="0.22" />
      <path
        d="M9 14h22M11.5 20h17M14 26h12"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M20 7v26M20 12c-3.4 1.6-4.6 4.2-4.6 7M20 12c3.4 1.6 4.6 4.2 4.6 7"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="33" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function BrandLockup({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark className={compact ? "h-7 w-7" : "h-10 w-10"} />
      <div className="leading-tight">
        <div
          className={cn(
            "font-display font-semibold",
            compact ? "text-[15px]" : "text-lg sm:text-xl",
          )}
        >
          Deeper Life Bible Church
        </div>
        <div
          className={cn(
            "uppercase tracking-[0.28em] opacity-70",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          Pontypridd
        </div>
      </div>
    </div>
  );
}