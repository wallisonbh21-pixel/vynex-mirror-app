import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VYNEXA — Plataforma SaaS para operações de sites" },
      {
        name: "description",
        content:
          "A VYNEXA centraliza venda, criação e manutenção de sites: vendedores, criadores, comissões, metas e financeiro em um só lugar.",
      },
      { property: "og:title", content: "VYNEXA — Plataforma SaaS para operações de sites" },
      {
        property: "og:description",
        content:
          "Times de vendedores e criadores, comissões, metas e financeiro sob controle em uma única plataforma.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Users,
    title: "Vendedores",
    text: "Leads, clientes, contratos, comissões, metas e saques em um painel próprio.",
  },
  {
    icon: Palette,
    title: "Criadores",
    text: "Fila de projetos, produção de sites, entregas e comissão por projeto.",
  },
  {
    icon: Building2,
    title: "Clientes",
    text: "Empresas, nicho, cidade e mensalidades recorrentes organizadas.",
  },
  {
    icon: Wallet,
    title: "Financeiro",
    text: "Histórico de transações, saques via PIX e percentuais configuráveis.",
  },
  {
    icon: BarChart3,
    title: "Indicadores",
    text: "Receita, recorrência e desempenho do time em tempo real.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    text: "Cada usuário enxerga apenas o que sua permissão permite.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.32em]">VYNEXA</span>
            <span className="block text-[10px] tracking-[0.22em] text-muted-foreground">
              DIGITAL BUSINESS
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/auth"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Acessar plataforma
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-halo" />
        <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-20 text-center">
          <span className="inline-flex rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            Plataforma SaaS para operações de sites
          </span>
          <h1 className="mt-8 text-5xl font-bold leading-[1.05] sm:text-6xl">
            Transforme oportunidades em{" "}
            <span className="text-gradient-brand">negócios digitais</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A VYNEXA centraliza a venda, a criação e a manutenção de sites para empresas — com
            times de vendedores e criadores, comissões, metas e financeiro sob controle.
          </p>
          <Link
            to="/auth"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
          >
            Entrar na plataforma <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-panel"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <feature.icon className="size-5" />
            </span>
            <h2 className="mt-5 text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} VYNEXA Digital Business</span>
          <Link to="/auth" className="hover:text-foreground">
            Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
