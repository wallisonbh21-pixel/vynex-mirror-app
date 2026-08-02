import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  CalendarClock,
  FileSignature,
  History,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, useAvatarUrl, useProfile, useRoles, useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Menu do time comercial (vendedor). */
const NAV_VENDEDOR = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Target },
  { to: "/pipeline", label: "Funil de Vendas", icon: KanbanSquare },
  { to: "/followups", label: "Acompanhamentos", icon: CalendarClock },
  { to: "/clientes", label: "Clientes", icon: Building2 },
  { to: "/contratos", label: "Contratos", icon: FileSignature },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/projetos", label: "Projetos", icon: Palette },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/metas", label: "Metas", icon: BarChart3 },
] as const;

/** Menu do time de criação — sem acesso ao CRM comercial. */
const NAV_CRIADOR = [
  { to: "/criacao", label: "Visão geral", icon: LayoutDashboard },
  { to: "/disponiveis", label: "Projetos disponíveis", icon: Layers },
  { to: "/meus-projetos", label: "Meus projetos", icon: Palette },
  { to: "/meus-saques", label: "Meus saques", icon: Wallet },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);
  const { isAdmin, isCriador, primaryRole } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
  const base: NavItem[] = isAdmin
    ? [...NAV_VENDEDOR]
    : isCriador
      ? [...NAV_CRIADOR]
      : [...NAV_VENDEDOR];
  const items: NavItem[] = [
    ...(isAdmin
      ? [
          ...base,
          { to: "/criacao", label: "Área do criador", icon: Layers },
          { to: "/admin", label: "Administração", icon: ShieldCheck },
        ]
      : base),
    { to: "/perfil", label: "Meu perfil", icon: UserRound },
  ];

  const displayName = profile?.nickname || profile?.full_name || "Sem nome";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-2 transition-opacity hover:opacity-80">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.28em]">VYNEXA</span>
            <span className="block text-[10px] tracking-[0.2em] text-muted-foreground">
              DIGITAL BUSINESS
            </span>
          </span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-0.5",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className={cn("size-4 transition-colors", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/perfil"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-sidebar-border bg-card p-3 transition-colors hover:border-primary/50"
        >
          <Avatar url={avatarUrl ?? null} initials={initials} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{displayName}</span>
            <span className="block truncate text-xs text-primary">
              {ROLE_LABEL[primaryRole] ?? primaryRole}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">{user?.email}</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="size-4" /> Sair
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="lg:hidden">
                <Avatar url={avatarUrl ?? null} initials={initials} />
              </span>
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto lg:hidden">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors",
                  pathname === item.to
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              Sair
            </button>
          </nav>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Avatar({ url, initials }: { url: string | null; initials: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt="Foto de perfil"
        className="size-10 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground">
      {initials || "V"}
    </span>
  );
}

export { Users };
