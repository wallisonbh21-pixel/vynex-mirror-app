import type { LucideIcon, LucideProps } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon | React.ComponentType<LucideProps> | React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  status?: 'active' | 'success' | 'warning' | 'idle';
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  status = 'idle',
  className,
}: StatCardProps) {
  
  const renderIcon = () => {
    if (!Icon) return null;
    
    // Check if it's a React element (like <Activity />)
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    
    // Check if it's a component type (like Target)
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && 'render' in (Icon as any))) {
      const IconComponent = Icon as React.ComponentType<LucideProps>;
      return <IconComponent className="size-4" />;
    }

    // Fallback for strings or other types that might be ReactNode
    return Icon as React.ReactNode;
  };

  return (
    <div className={cn("premium-card p-5 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-foreground tracking-tight">{value}</h3>
          </div>
        </div>
        <div className={cn(
          "size-8 rounded-xl flex items-center justify-center border shadow-sm transition-colors",
          status === 'active' && "bg-primary/10 border-primary/20 text-primary shadow-glow",
          status === 'success' && "bg-success/10 border-success/20 text-success",
          status === 'warning' && "bg-warning/10 border-warning/20 text-warning",
          status === 'idle' && "bg-muted/30 border-border text-muted-foreground"
        )}>
          {renderIcon()}
        </div>
      </div>

      {(hint || trend) && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {hint && (
            <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[70%]">
              {hint}
            </span>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
              trend.positive 
                ? "bg-success/10 border-success/20 text-success" 
                : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
