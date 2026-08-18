import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

// Note: This is a design pattern wrapper around the shadcn table
// to ensure consistency across the platform.

interface PremiumTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function PremiumTable({ headers, children, className }: PremiumTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="border-b border-border/50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">{children}</tbody>
      </table>
    </div>
  );
}

// Mobile variant that renders as cards
export function PremiumTableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:hidden", className)}>
      {children}
    </div>
  );
}
