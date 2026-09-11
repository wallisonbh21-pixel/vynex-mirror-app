import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegacyMetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: { value: string; direction?: "up" | "down" | "neutral" };
  className?: string;
}

/** MetricCard do Design System Legacy — uso exclusivo do dashboard /admin. */
export function LegacyMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: LegacyMetricCardProps) {
  const direction = trend?.direction ?? "neutral";
  const TrendIcon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <div className={cn("surface card-hover relative overflow-hidden p-5", className)}>
      <div className="relative flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>

      <p className="relative mt-3 truncate font-display text-2xl font-semibold tracking-tight md:text-3xl">
        {value}
      </p>

      {(hint || trend) && (
        <div className="relative mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                direction === "up"
                  ? "bg-success/12 text-success"
                  : direction === "down"
                    ? "bg-destructive/12 text-destructive"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <TrendIcon className="size-3" aria-hidden="true" />
              {trend.value}
            </span>
          )}
          {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
