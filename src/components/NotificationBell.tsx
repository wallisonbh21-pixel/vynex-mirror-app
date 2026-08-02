import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = items.filter((item) => !item.read_at).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,90vw)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <CheckCheck className="size-3.5" /> Marcar todas como lidas
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          ) : (
            items.map((item) => {
              const content = (
                <>
                  <span className="block text-sm font-medium">{item.title}</span>
                  {item.body ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                  ) : null}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(item.created_at),
                    )}
                  </span>
                </>
              );
              const className = cn(
                "block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                !item.read_at && "bg-primary/5",
              );
              const onClick = () => {
                if (!item.read_at) markRead.mutate(item.id);
                setOpen(false);
              };
              return item.link ? (
                <Link key={item.id} to={item.link} className={className} onClick={onClick}>
                  {content}
                </Link>
              ) : (
                <button key={item.id} type="button" className={className} onClick={onClick}>
                  {content}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
