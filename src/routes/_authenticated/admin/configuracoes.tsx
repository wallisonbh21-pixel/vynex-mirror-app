import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  beforeLoad: () => requireAdmin(),
  component: () => (
    <AppShell title="Configurações" description="Ajustes globais da plataforma.">
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Área em desenvolvimento.
      </div>
    </AppShell>
  ),
});
