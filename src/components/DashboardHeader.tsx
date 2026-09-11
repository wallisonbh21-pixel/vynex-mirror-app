import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-semibold text-foreground md:text-[1.75rem]">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="mt-3 flex items-center gap-3 md:mt-0">{actions}</div>}
    </div>
  );
}
