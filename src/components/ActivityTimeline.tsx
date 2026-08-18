import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
  type?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
  emptyMessage?: string;
}

export function ActivityTimeline({
  activities,
  className,
  emptyMessage = "Nenhuma atividade registrada recentemente.",
}: ActivityTimelineProps) {
  return (
    <div className={cn("space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/30", className)}>
      {activities.length > 0 ? (
        activities.map((activity, idx) => (
          <div key={activity.id || idx} className="relative pl-8 group">
            <div className="absolute left-0 top-1 size-[24px] rounded-full border-2 border-background bg-card flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors">
              <div className="size-2 rounded-full bg-primary" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.body}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded shrink-0 self-start sm:self-center">
                {new Date(activity.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground italic pl-8">{emptyMessage}</p>
      )}
    </div>
  );
}
