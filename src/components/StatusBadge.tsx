import { cn } from "@/lib/utils";
import { STATUS_LABEL, statusTone } from "@/lib/format";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "danger" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
        tone === "neutral" && "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
