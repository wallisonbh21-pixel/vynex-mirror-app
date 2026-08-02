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
  Menu,
  BellRing,
  CircleDollarSign,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, useAvatarUrl, useProfile, useRoles, useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";

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
  { to: "/comissoes", label: "Comissões", icon: CircleDollarSign },
  { to: "/metas", label: "Metas", icon: BarChart3 },
  { to: "/notificacoes", label: "Notificações", icon: BellRing },
] as const;

/** Menu do time de criação — sem acesso ao CRM comercial. */
const NAV_CRIADOR = [
  { to: "/criacao", label: "Visão geral", icon: LayoutDashboard },
  { to: "/disponiveis", label: "Projetos disponíveis", icon: Layers },
  { to: "/meus-projetos", label: "Meus projetos", icon: Palette },
  { to: "/comissoes", label: "Comissões", icon: CircleDollarSign },
  { to: "/meus-saques", label: "Meus saques", icon: Wallet },
  { to: "/notificacoes", label: "Notificações", icon: BellRing },
] as const;

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu lateral ao navegar no celular.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const base: NavItem[] = isAdmin
    ? [...NAV_VENDEDOR]
    : isCriador
      ? [...NAV_CRIADOR]
      : [...NAV_VENDEDOR];
  const items: NavItem[] = [
    ...(isAdmin
      ? [
          ...base,
          { to: "/aprovacoes", label: "Aprovação de sites", icon: ShieldCheck },
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

  const sidebar = (
    <SidebarContent
      items={items}
      pathname={pathname}
      displayName={displayName}
      roleLabel={ROLE_LABEL[primaryRole] ?? primaryRole}
      email={user?.email ?? null}
      avatarUrl={avatarUrl ?? null}
      initials={initials}
      onSignOut={signOut}
    />
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Menu lateral vertical fixo (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* Botão ☰ — abre o menu lateral no celular */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex w-72 flex-col gap-0 border-sidebar-border bg-sidebar px-4 py-6"
                >
                  <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                  {sidebar}
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">{title}</h1>
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  items,
  pathname,
  displayName,
  roleLabel,
  email,
  avatarUrl,
  initials,
  onSignOut,
}: {
  items: NavItem[];
  pathname: string;
  displayName: string;
  roleLabel: string;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
  onSignOut: () => void;
}) {
  return (
    <>
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

      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("size-4 shrink-0 transition-colors", active && "text-primary")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/perfil"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-sidebar-border bg-card p-3 transition-colors hover:border-primary/50"
      >
        <Avatar url={avatarUrl} initials={initials} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{displayName}</span>
          <span className="block truncate text-xs text-primary">{roleLabel}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{email}</span>
        </span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start transition-colors hover:bg-destructive/10 hover:text-destructive"
        onClick={onSignOut}
      >
        <LogOut className="size-4" /> Sair
      </Button>
    </>
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
