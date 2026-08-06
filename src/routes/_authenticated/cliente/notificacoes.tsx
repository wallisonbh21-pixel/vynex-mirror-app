import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { BellRing } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/notificacoes")({
  component: () => (
    <AppShell title="Notificações">
      <Card className="p-12 text-center border-dashed">
        <BellRing className="size-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground">Você não tem novas notificações.</p>
      </Card>
    </AppShell>
  ),
});
