import { cn } from "@/lib/utils";

function Progress({ value = 0, className, indicatorClassName }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-200", className)}
    >
      <div
        className={cn("h-full rounded-full bg-indigo-600 transition-all", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
