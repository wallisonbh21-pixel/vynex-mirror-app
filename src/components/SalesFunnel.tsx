import { LEAD_STATUS, label, currency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/crm";

interface SalesFunnelProps {
  leads: Lead[];
}

export function SalesFunnel({ leads }: SalesFunnelProps) {
  const counts = LEAD_STATUS.map((status) => {
    const rows = leads.filter((l) => l.status === status);
    const value = rows.reduce((sum, l) => sum + Number(l.closed_value || l.estimated_value), 0);
    return { status, count: rows.length, value };
  });

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="grid gap-2">
      {counts.map((item, index) => {
        // Tapering width based on index to simulate funnel shape
        const funnelWidth = 100 - index * 8;
        const progressWidth = (item.count / maxCount) * 100;

        return (
          <div key={item.status} className="group relative">
            <div
              className={cn(
                "h-12 overflow-hidden rounded-lg bg-secondary/30 transition-all group-hover:bg-secondary/50",
                "mx-auto border border-border/50 shadow-sm"
              )}
              style={{ width: `${funnelWidth}%` }}
            >
              {/* Fill background based on count relative to max */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 bg-primary/20 transition-all",
                  item.status === "fechado" ? "bg-success/20" : 
                  item.status === "perdido" ? "bg-destructive/10" : ""
                )}
                style={{ width: `${progressWidth}%` }}
              />
              
              <div className="flex h-full items-center justify-between px-4 text-sm relative z-10">
                <span className="font-semibold text-foreground/90">
                  {label(item.status)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{item.count} leads</span>
                  <span className="text-muted-foreground">{currency(item.value)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
