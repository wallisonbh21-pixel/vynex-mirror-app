import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DashboardSectionProps {
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ children, className }: DashboardSectionProps) {
  return (
    <div className={cn("grid gap-6", className)}>
      {children}
    </div>
  );
}
