import { cn } from "@/lib/utils";

/**
 * Brand mark: three descending strata with a taproot — "deeper life" as depth
 * and rootedness. Deliberately not a cross/dove/stained-glass motif.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M8 13h24M10.5 20h19M14 27h12M18 33h4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
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