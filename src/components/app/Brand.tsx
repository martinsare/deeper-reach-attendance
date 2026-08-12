import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      className={cn("h-9 w-9 object-contain", className)}
    />
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
