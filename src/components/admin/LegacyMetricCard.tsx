import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegacyMetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning" | "muted";
  trend?: { value: string; positive?: boolean };
  className?: string;
}

const TONES: Record<
  NonNullable<LegacyMetricCardProps["tone"]>,
  { icon: string; glow: string }
> = {
  primary: {
    icon: "bg-primary/12 border-primary/30 text-primary",
    glow: "from-primary/18",
  },
  accent: {
    icon: "bg-accent/12 border-accent/30 text-accent",
    glow: "from-accent/18",
  },
  success: {
    icon: "bg-success/12 border-success/30 text-success",
    glow: "from-success/16",
  },
  warning: {
    icon: "bg-warning/12 border-warning/30 text-warning",
    glow: "from-warning/16",
  },
  muted: {
    icon: "bg-muted/40 border-border text-muted-foreground",
    glow: "from-muted/30",
  },
};

/** MetricCard do Design System Legacy — uso exclusivo do dashboard /admin. */
export function LegacyMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
  className,
}: LegacyMetricCardProps) {
  const t = TONES[tone];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel backdrop-blur transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-gradient-to-br to-transparent opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          t.glow,
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="font-display truncate text-[26px] font-bold leading-none tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            t.icon,
          )}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>

      {(hint || trend) && (
        <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
          {trend && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                trend.positive
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
