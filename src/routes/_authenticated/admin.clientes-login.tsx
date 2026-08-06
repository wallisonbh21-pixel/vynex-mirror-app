import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding, useRegisterClient } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Building2, 
  Search, 
  ShieldCheck,
  Send,
  Plus,
  Circle,
  Mail,
  User,
  Ban,
  CheckCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute('/_authenticated/admin/clientes-login')({
  beforeLoad: () => requireAdmin(),
  component: AdminClientesLogin,
});

function AdminClientesLogin() {
  const { data: clients, isLoading } = useClientsList();
  const onboarding = useClientOnboarding();
  const register = useRegisterClient();
  const [searchTerm, setSearchTerm] = useState("");

  const registerFields: Field[] = [
    { name: "username", label: "Usuário *", required: true, placeholder: "Ex: joaosilva" },
    { name: "contact_email", label: "E-mail *", type: "email", required: true, placeholder: "Ex: joao@email.com" },
    { name: "contact_name", label: "Nome completo", placeholder: "Opcional" },
    { name: "contact_phone", label: "Telefone", placeholder: "Opcional" },
    { name: "company", label: "Empresa/Negócio", placeholder: "Opcional" },
    { name: "notes", label: "Observações", type: "textarea", placeholder: "Opcional" },
  ];

  const filteredClients = clients?.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (c.contact_name?.toLowerCase() || "").includes(searchLower) ||
      (c.contact_email?.toLowerCase() || "").includes(searchLower) ||
      (c.company?.toLowerCase() || "").includes(searchLower)
    );
  });

  const handleResendAccess = async (client: any) => {
    try {
      const result = await onboarding.mutateAsync({
        clientId: client.id,
        username: (client as any).profiles?.nickname || JSON.parse(client.notes || '{}').pending_username || client.contact_name
      } as any);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {}
  };

  return (
    <AppShell 
      title="Gerenciamento de Acessos" 
      description="Gerencie os acessos, reenvie convites e monitore o status de todos os clientes."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <RecordDialog
            title="Novo Cliente"
            fields={registerFields}
            onSubmit={async (values) => {
              await register.mutateAsync(values);
            }}
            trigger={
              <Button className="gap-2 font-bold shadow-md">
                <Plus className="size-4" />
                Cadastrar Cliente
              </Button>
            }
          />
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
            ))
          ) : filteredClients?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredClients?.map((client) => {
              const hasLogin = !!client.user_id;
              // No user-facing apps, we usually check for a 'last_sign_in_at' or similar.
              // For now, if user_id exists, it's the first step. 
              // The user requirement says "Status inicial = Acesso pendente".
              // I will use client.status if it's 'active' vs 'pending' if the schema allows, 
              // but standardizing on a visual check based on user_id for simplicity as per existing logic.
              const status = hasLogin ? "Acesso ativo" : "Acesso pendente";
              const username = (client as any).profiles?.nickname || (()=>{
                try { return JSON.parse(client.notes || '{}').pending_username || '-'; } catch { return '-'; }
              })();

              return (
                <div key={client.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-border bg-card hover:shadow-sm transition-all gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-lg shrink-0",
                      hasLogin ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      <User className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-none mb-2">
                        {client.contact_name || "Sem nome"}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5" />
                          <span className="font-medium text-foreground">Usuário:</span> {username}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-3.5" />
                          <span className="font-medium text-foreground">E-mail:</span> {client.contact_email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider",
                      hasLogin 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    )}>
                      {hasLogin ? (
                        <>
                          <CheckCircle className="size-3.5" />
                          Acesso ativo
                        </>
                      ) : (
                        <>
                          <Circle className="size-3.5" />
                          Acesso pendente
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 text-primary hover:text-primary hover:bg-primary/5 font-bold"
                        onClick={() => handleResendAccess(client)}
                      >
                        <Send className="size-3.5" />
                        Reenviar Acesso
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Ban className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
