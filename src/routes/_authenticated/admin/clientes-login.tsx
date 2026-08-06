import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding, useRegisterClient } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Search, 
  Plus, 
  Send,
  Mail,
  User,
  Ban,
  CheckCircle,
  Circle,
  MoreVertical,
  Calendar,
  Lock,
  Bell,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute('/_authenticated/admin/clientes-login')({
  beforeLoad: () => requireAdmin(),
  component: AdminLoginCentral,
});

function AdminLoginCentral() {
  const { data: clients, isLoading } = useClientsList();
  const onboarding = useClientOnboarding();
  const register = useRegisterClient();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients?.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (c.contact_name?.toLowerCase() || "").includes(searchLower) ||
      (c.contact_email?.toLowerCase() || "").includes(searchLower) ||
      (c.company?.toLowerCase() || "").includes(searchLower)
    );
  });

  const clientsWithLogin = filteredClients?.filter(c => !!c.user_id) || [];
  const clientsWithoutLogin = filteredClients?.filter(c => !c.user_id) || [];

  return (
    <AppShell 
      title="Login do Cliente" 
      description="Gerencie os acessos, comunique-se e acompanhe seus clientes."
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="🔎 Buscar cliente..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="gap-2 font-bold shadow-md" onClick={() => {}}>
            <Plus className="size-4" /> Cadastrar Cliente
          </Button>
        </div>

        {/* Clientes com Login */}
        <section>
          <h2 className="text-xl font-bold mb-4">Clientes com Acesso</h2>
          <div className="grid gap-4">
            {isLoading ? (
              <div className="h-24 rounded-xl border bg-card animate-pulse" />
            ) : clientsWithLogin.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border rounded-xl bg-card">Nenhum cliente com login ativo.</div>
            ) : (
              clientsWithLogin.map(client => {
                const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
                const username = (profile as any)?.nickname || '-';
                return (
                  <div key={client.id} className="p-5 rounded-xl border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <User className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">{client.contact_name}</h3>
                        <p className="text-sm text-muted-foreground">Usuário: {username} | E-mail: {client.contact_email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Empresa: {client.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">🟢 Ativo</Badge>
                      <Button variant="ghost" size="sm" className="gap-1"><Lock className="size-3.5"/> Acesso</Button>
                      <Button variant="ghost" size="sm" className="gap-1"><Mail className="size-3.5"/> E-mail</Button>
                      <Button variant="ghost" size="sm" className="gap-1"><Key className="size-3.5"/> Senha</Button>
                      <Button variant="ghost" size="sm" className="gap-1"><Bell className="size-3.5"/> Notificar</Button>
                      <Button variant="ghost" size="sm" className="gap-1"><Calendar className="size-3.5"/> Reunião</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Clientes sem Acesso */}
        <section>
          <h2 className="text-xl font-bold mb-4">Clientes sem acesso</h2>
          <div className="grid gap-4">
            {clientsWithoutLogin.map(client => (
              <div key={client.id} className="p-5 rounded-xl border bg-card flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{client.contact_name}</h3>
                  <p className="text-sm text-muted-foreground">{client.company} • {client.contact_email}</p>
                </div>
                <Button variant="outline" className="gap-2 text-primary font-bold">
                  <Plus className="size-4" /> Cadastrar Login
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
