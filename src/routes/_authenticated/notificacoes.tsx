import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  FileSignature,
  Layers,
  MessageSquareWarning,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type Notification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — ScaleNexus" },
      {
        name: "description",
        content: "Central de avisos da ScaleNexus: projetos, aprovações, contratos e saques em tempo real.",
      },
      { property: "og:title", content: "Notificações — ScaleNexus" },
      { property: "og:description", content: "Acompanhe todos os avisos da sua operação ScaleNexus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificacoesPage,
});

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "nao_lidas", label: "Não lidas" },
  { value: "lidas", label: "Lidas" },
] as const;

/** Ícone conforme o assunto da notificação. */
function iconFor(item: Notification): LucideIcon {
  const text = `${item.category} ${item.title}`.toLowerCase();
  if (text.includes("saque")) return Wallet;
  if (text.includes("contrato")) return FileSignature;
  if (text.includes("altera") || text.includes("ajuste")) return MessageSquareWarning;
  if (text.includes("aprov")) return ShieldCheck;
  if (text.includes("comiss")) return CircleDollarSign;
  if (text.includes("projeto")) return Layers;
  return Bell;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const timeOnly = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

function NotificacoesPage() {
  const { data: items = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [filter, setFilter] = useState<string>("todas");

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        filter === "nao_lidas" ? !item.read_at : filter === "lidas" ? !!item.read_at : true,
      ),
    [items, filter],
  );
  const unread = items.filter((item) => !item.read_at).length;

  return (
    <AppShell
      title="Notificações"
      description="Tudo o que aconteceu na sua operação, em ordem cronológica."
      actions={
        <Button variant="outline" onClick={() => markAll.mutate()} disabled={unread === 0}>
          <CheckCheck className="size-4" /> Marcar todas como lidas
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-all duration-200 hover:-translate-y-0.5",
              filter === item.value
                ? "border-primary bg-primary/15 text-primary shadow-glow"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {item.label}
            {item.value === "nao_lidas" && unread > 0 ? ` (${unread})` : ""}
          </button>
        ))}
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <ul className="divide-y divide-border">
          {filtered.map((item) => {
            const Icon = iconFor(item);
            const created = new Date(item.created_at);
            const body = (
              <span className="flex w-full items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    item.read_at ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {!item.read_at ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Não lida
                      </span>
                    ) : null}
                  </span>
                  {item.body ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                  ) : null}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {dateTime.format(created)} · {timeOnly.format(created)}
                  </span>
                </span>
              </span>
            );
            const className = cn(
              "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50",
              !item.read_at && "bg-primary/5",
            );
            const onClick = () => {
              if (!item.read_at) markRead.mutate(item.id);
            };

            return (
              <li key={item.id}>
                {item.link ? (
                  <Link to={item.link} className={className} onClick={onClick}>
                    {body}
                  </Link>
                ) : (
                  <button type="button" className={className} onClick={onClick}>
                    {body}
                  </button>
                )}
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-4 py-16 text-center text-sm text-muted-foreground">
              {isLoading ? "Carregando notificações…" : "Você ainda não possui notificações por aqui."}
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
