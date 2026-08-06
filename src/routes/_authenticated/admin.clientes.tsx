import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useRegisterClient, useClientOnboarding } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck,
  Circle,
  UserPlus,
  Mail,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute('/_authenticated/admin/clientes')({
  beforeLoad: () => requireAdmin(),
  component: AdminClientes,
});

function AdminClientes() {
  const queryClient = useQueryClient();
  const { data: clients, isLoading } = useClientsList();
  const registerClient = useRegisterClient();
  const onboarding = useClientOnboarding();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const clientRegistrationFields: Field[] = [
    { name: "username", label: "Usuário *", required: true, placeholder: "Ex: joaosilva" },
    { name: "contact_email", label: "E-mail *", type: "email", required: true, placeholder: "Ex: joao@email.com" },
    { name: "contact_name", label: "Nome completo", placeholder: "Opcional" },
    { name: "contact_phone", label: "Telefone", placeholder: "Opcional" },
    { name: "company", label: "Empresa/Negócio", placeholder: "Opcional" },
    { name: "notes", label: "Observações", type: "textarea", placeholder: "Opcional" },
  ];

  const handleRegisterClient = async (values: Record<string, unknown>) => {
    try {
      const submissionData = {
        ...values,
        notes: values.notes || "",
      };
      await registerClient.mutateAsync(submissionData);
    } catch (error) {
      // toast is handled by hook
    }
  };

  const selectedClient = clients?.find(c => c.id === selectedClientId);
  
  const pendingUsername = (() => {
    if (!selectedClient?.notes) return "";
    try {
      const notes = JSON.parse(selectedClient.notes);
      return notes.pending_username || "";
    } catch {
      return "";
    }
  })();

  const loginFields: Field[] = [
    { 
      name: "fullName", 
      label: "Nome completo", 
      defaultValue: selectedClient?.contact_name || "",
      disabled: true,
    },
    { 
      name: "username", 
      label: "Usuário", 
      defaultValue: pendingUsername,
      disabled: true,
    },
    { 
      name: "email", 
      label: "E-mail", 
      type: "email", 
      defaultValue: selectedClient?.contact_email || "",
      disabled: true,
    },
    { 
      name: "company", 
      label: "Empresa", 
      defaultValue: selectedClient?.company || "",
      disabled: true,
    },
    { 
      name: "clientId", 
      label: "Client ID", 
      type: "hidden",
      defaultValue: selectedClientId,
    }
  ];

  const handleCreateLogin = async (values: Record<string, unknown>) => {
    try {
      // RecordDialog might not include disabled fields in values, so we merge
      const payload = {
        clientId: selectedClientId,
        email: selectedClient?.contact_email,
        fullName: selectedClient?.contact_name || "Cliente",
        username: pendingUsername,
      };
      
      const result = await onboarding.mutateAsync(payload as any);
      if (result.success) {
        toast.success(result.message || "Acesso criado!");
        setSelectedClientId("");
      }
    } catch (error) {
      // handled by hook
    }
  };

  const filteredClients = clients?.filter((c) => {
    return c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.notes?.toLowerCase() || "").includes(searchTerm.toLowerCase());
  });

  return (
    <AppShell 
      title="Clientes" 
      description="Gerenciamento central de clientes e acessos."
      actions={
        <RecordDialog
          title="Cadastrar Cliente"
          fields={clientRegistrationFields}
          onSubmit={handleRegisterClient}
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Cadastrar Cliente
            </Button>
          }
        />
      }
    >
      <div className="space-y-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
            ))
          ) : filteredClients?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredClients?.map((client) => {
              const hasLogin = !!client.user_id;
              return (
                <div key={client.id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Building2 className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg leading-none">
                          {client.contact_name || "Sem nome"}
                        </h3>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold h-5">
                          {client.status || 'Ativo'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">Usuário:</span> {(() => {
                            try {
                              return JSON.parse(client.notes || '{}').pending_username || '-';
                            } catch { return '-'; }
                          })()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">E-mail:</span> {client.contact_email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">Empresa:</span> {client.company || '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {hasLogin && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="size-4" />
                        <span className="text-sm font-bold">Acesso ativo</span>
                      </div>
                    )}
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