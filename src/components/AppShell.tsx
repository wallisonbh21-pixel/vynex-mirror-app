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
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
  Rocket,
  Plus,
  Compass,
  Monitor,
  CheckCircle2,
  Eye,
  Send,
  Library,
  Box,
  Layout,
  Star,
  Trophy,
  Flame,
  ChevronDown,
  Clock,
  FolderOpen,
  Lock,
  Share2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, useAvatarUrl, useProfile, useRoles, useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarSubmenu } from "./SidebarSubmenu";

interface SubmenuItem {
  to: string;
  label: string;
  icon: any;
  description?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  submenu?: SubmenuItem[];
}

/** Menu do time comercial (vendedor). */
const NAV_VENDEDOR: NavItem[] = [
  { to: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { to: "/prospeccao", label: "Prospecção", icon: Search },
  { to: "/leads", label: "Leads", icon: Target },
  { to: "/pipeline", label: "Funil de Vendas", icon: KanbanSquare },
  { to: "/followups", label: "Acompanhamentos", icon: CalendarClock },
  { 
    to: "/clientes", 
    label: "Clientee", 
    icon: Users,
    submenu: [
      { to: "/clientes", label: "Clientees", icon: Users },
      { to: "/vendedor/clientes-login", label: "Login do Clientee", icon: Lock },
    ]
  },
  { to: "/contratos", label: "Contratos", icon: FileSignature },
  { to: "/reunioes", label: "Reuniões", icon: CalendarClock },
  { to: "/indicar", label: "Indicação de Clientees", icon: Share2 },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/projetos", label: "Projetos", icon: Palette },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/comissoes", label: "Comissões", icon: CircleDollarSign },
  { to: "/metas", label: "Metas", icon: BarChart3 },
  { to: "/notificacoes", label: "Notificações", icon: BellRing },
];


/** Menu do time de criação — Reorganizado V2.3. */
const NAV_CRIADOR: NavItem[] = [
  { 
    to: "/criacao", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    submenu: [
      { to: "/criacao", label: "Visão geral", icon: LayoutDashboard },
      { to: "/meus-projetos", label: "Projetos ativos", icon: Palette },
      { to: "/aprovacoes", label: "Aguardando aprovação", icon: Clock },
      { to: "/metas", label: "Produtividade", icon: BarChart3 },
    ]
  },
  { 
    to: "/studio-new", 
    label: "Criar Site", 
    icon: Rocket,
    submenu: [
      { to: "/disponiveis", label: "Assumir novo site", icon: Plus },
      { to: "/meus-projetos", label: "Continuar edição", icon: Palette },
    ]
  },
  { 
    to: "/meus-projetos", 
    label: "Projetos", 
    icon: FolderOpen,
    submenu: [
      { to: "/meus-projetos", label: "Todos os projetos", icon: Library },
      { to: "/disponiveis", label: "Disponíveis", icon: Layers },
    ]
  },
  { 
    to: "/reunioes", 
    label: "Reuniões", 
    icon: CalendarClock 
  },
  { 
    to: "/recursos", 

    label: "Recursos", 
    icon: Library,
    submenu: [
      { to: "/studio-new", label: "Biblioteca", icon: Box },
      { to: "/studio-new", label: "Templates", icon: Layout },
    ]
  },
  { 
    to: "/metas", 
    label: "Metas", 
    icon: Trophy,
    submenu: [
      { to: "/metas", label: "Minhas Metas", icon: Target },
      { to: "/metas", label: "Conquistas", icon: Star },
    ]
  },
  { 
    to: "/comissoes", 
    label: "Financeiro", 
    icon: Wallet,
    submenu: [
      { to: "/comissoes", label: "Minhas comissões", icon: CircleDollarSign },
      { to: "/meus-saques", label: "Meus saques", icon: Wallet },
    ]
  },
  { to: "/notificacoes", label: "Notificações", icon: BellRing },
];

/** Menu do portal do cliente. */
const NAV_CLIENTE: NavItem[] = [
  { to: "/cliente", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cliente/projeto", label: "Meu Projeto", icon: Palette },
  { to: "/cliente/site", label: "Meu Site", icon: Monitor },
  { to: "/cliente/reunioes", label: "Reuniões", icon: CalendarClock },
  { to: "/cliente/mensagens", label: "Mensagens", icon: Send },
  { to: "/cliente/documentos", label: "Documentos", icon: FileSignature },
  { to: "/cliente/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/cliente/aprovacoes", label: "Aprovações", icon: ShieldCheck },
  { to: "/cliente/notificacoes", label: "Notificações", icon: BellRing },
  { to: "/cliente/perfil", label: "Meu Perfil", icon: UserRound },
];

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
  const queryCliente = useQueryClient();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);
  const { isAdmin, isCriador, isClientee, primaryRole } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu lateral ao navegar no celular.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const items: NavItem[] = isAdmin
    ? [
        ...NAV_VENDEDOR,
        { to: "/aprovacoes", label: "Aprovação de sites", icon: ShieldCheck },
        { to: "/criacao", label: "Área do criador", icon: Layers },
        { 
          to: "/admin/clientes", 
          label: "Clientee", 
          icon: Users,
          submenu: [
            { to: "/admin/clientes", label: "Clientees", icon: Users },
            { to: "/admin/clientes-login", label: "Login do Clientee", icon: Lock },
          ]
        },
        { 
          to: "/admin", 
          label: "Visão Geral", 
          icon: LayoutDashboard,
        },
        { 
          to: "/admin/usuarios", 
          label: "Usuários", 
          icon: Users,
        },
        { 
          to: "/admin/saques", 
          label: "Financeiro / Saques", 
          icon: Wallet,
        },
        { 
          to: "/admin/configuracoes", 
          label: "Configurações", 
          icon: ShieldCheck,
        },
        { to: "/perfil", label: "Meu perfil", icon: UserRound },
      ]
    : isCriador
      ? [
          ...NAV_CRIADOR,
          { to: "/perfil", label: "Meu perfil", icon: UserRound },
        ]
      : isClientee
      ? [
          ...NAV_CLIENTE,
        ]
      : [
          ...NAV_VENDEDOR,
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
    await queryCliente.cancelQueries();
    queryCliente.clear();
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
    <div className="flex min-h-screen bg-background text-foreground">
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
                <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <ThemeToggle />
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  return (
    <>
      <Link to="/" className="flex items-center gap-3 px-2 transition-opacity hover:opacity-80">
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow">
          <Sparkles className="size-4" />
        </span>
        <span>
          <span className="block text-sm font-bold tracking-[0.28em] uppercase">ScaleNexus</span>
          <span className="block text-[10px] tracking-[0.2em] text-muted-foreground font-medium">
            DIGITAL BUSINESS
          </span>
        </span>
      </Link>

      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
        {items.map((item) => {
          const active = pathname === item.to || (item.submenu?.some(s => s.to === pathname));
          const isExpanded = expandedItems.includes(item.label);
          const hasSubmenu = item.submenu && item.submenu.length > 0;

          return (
            <div key={item.label} className="flex flex-col">
              {hasSubmenu ? (
                <button
                  onClick={() => toggleExpand(item.label)}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 1024 && !isExpanded) toggleExpand(item.label);
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                    active
                      ? "bg-sidebar-accent/50 text-sidebar-accent-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("size-4 shrink-0 transition-colors", active && "text-primary")} aria-hidden="true" />
                    <span className="truncate font-medium">{item.label}</span>
                  </div>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                </button>
              ) : (
                <Link
                  to={item.to}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0 transition-colors", active && "text-primary")} aria-hidden="true" />
                  <span className="truncate font-medium">{item.label}</span>
                </Link>
              )}

              {hasSubmenu && (
                <SidebarSubmenu items={item.submenu!} pathname={pathname} isOpen={isExpanded} />
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          to="/perfil"
          className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-card p-3 transition-colors hover:border-primary/50 shadow-sm"
        >
          <Avatar url={avatarUrl} initials={initials} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{displayName}</span>
            <span className="block truncate text-[10px] font-bold text-primary uppercase tracking-wider">{roleLabel}</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start transition-colors hover:bg-destructive/10 hover:text-destructive text-xs font-semibold"
          onClick={onSignOut}
        >
          <LogOut className="size-4 mr-2" /> Sair da conta
        </Button>
      </div>
    </>
  );
}

function Avatar({ url, initials }: { url: string | null; initials: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt="Foto de perfil"
        className="size-10 shrink-0 rounded-full border border-border object-cover shadow-sm"
      />
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground shadow-glow">
      {initials || "S"}
    </span>
  );
}

export { Users };
