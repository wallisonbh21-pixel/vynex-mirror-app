import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("space-y-8 pb-10 animate-in fade-in duration-500", className)}>
      {children}
    </div>
  );
}
