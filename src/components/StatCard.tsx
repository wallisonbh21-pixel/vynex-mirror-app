import type { LucideIcon, LucideProps } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon | React.ComponentType<LucideProps>;
  trend?: {
    value: string;
    positive: boolean;
    label?: string;
  };
  status?: 'idle' | 'active' | 'warning' | 'success';
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  status,
  className,
  onClick,
}: StatCardProps) {
  const IconComponent = Icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 shadow-panel transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20",
          status === 'success' && "bg-success/10 text-success group-hover:bg-success/20",
          status === 'warning' && "bg-warning/10 text-warning group-hover:bg-warning/20",
          status === 'active' && "bg-primary/10 text-primary group-hover:bg-primary/20"
        )}>
          <IconComponent className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {trend && (
          <span className={cn(
            "flex items-center text-xs font-bold",
            trend.positive ? "text-emerald-500" : "text-destructive"
          )}>
            {trend.positive ? <TrendingUp className="mr-1 size-3" /> : <TrendingDown className="mr-1 size-3" />}
            {trend.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {trend?.label && <p className="mt-0.5 text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tight">{trend.label}</p>}
    </div>
  );
}

