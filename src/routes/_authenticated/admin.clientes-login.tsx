import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Building2, 
  Search, 
  UserPlus,
  ShieldCheck,
  Mail,
  Send,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRegisterClient } from "@/lib/client";

export const Route = createFileRoute('/_authenticated/admin/clientes-login')({
  beforeLoad: () => requireAdmin(),
  component: AdminClientesLogin,
});

function AdminClientesLogin() {
  const { data: clients, isLoading } = useClientsList();
  const onboarding = useClientOnboarding();
  const register = useRegisterClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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

  const registerFields: Field[] = [
    { 
      name: "username", 
      label: "Usuário", 
      required: true,
      placeholder: "Ex: joao_silva"
    },
    { 
      name: "contact_email", 
      label: "E-mail", 
      type: "email", 
      required: true,
      placeholder: "Ex: joao@email.com"
    }
  ];

  const loginFields: Field[] = [
    { 
      name: "fullName", 
      label: "Cliente", 
      defaultValue: selectedClient?.contact_name || selectedClient?.contact_email || "Cliente",
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
      name: "username", 
      label: "Usuário de Acesso", 
      defaultValue: pendingUsername,
      required: true,
      placeholder: "Defina o usuário de acesso ao portal"
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
      const payload = {
        clientId: selectedClientId,
        email: selectedClient?.contact_email!,
        fullName: selectedClient?.contact_name || "Cliente",
        username: values["username"] as string,
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

  const clientsWithoutLogin = clients?.filter((c) => !c.user_id && (c.status === 'active' || c.status === 'ativo'));
  const clientsWithLogin = clients?.filter((c) => !!c.user_id && (c.status === 'active' || c.status === 'ativo'));

  const filteredWithoutLogin = clientsWithoutLogin?.filter((c) => {
    const matchesSearch = 
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredWithLogin = clientsWithLogin?.filter((c) => {
    const matchesSearch = 
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AppShell 
      title="Login do Cliente" 
      description="Crie e gerencie o acesso dos clientes ao Portal ScaleNexus."
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

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
            Clientes sem login
          </h2>
          
          <div className="grid gap-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
              ))
            ) : filteredWithoutLogin?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
                {searchTerm ? "Nenhum cliente sem login encontrado." : "Nenhum cliente sem login."}
              </div>
            ) : (
              filteredWithoutLogin?.map((client) => (
                <div key={client.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-border bg-card hover:shadow-sm transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-none mb-1">
                        {client.contact_name || "Sem nome"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="size-3.5" />
                        {client.contact_email}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <RecordDialog
                      title="Cadastrar Login"
                      fields={loginFields}
                      onSubmit={handleCreateLogin}
                      onOpenChange={(open: boolean) => open && setSelectedClientId(client.id)}
                      trigger={
                        <Button variant="default" className="gap-2 font-bold shadow-sm">
                          <UserPlus className="size-4" />
                          Cadastrar Login
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {filteredWithLogin && filteredWithLogin.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
              Clientes com acesso
            </h2>
            <div className="grid gap-4">
              {filteredWithLogin.map((client) => (
                <div key={client.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-border bg-muted/30 gap-4 opacity-80">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-none mb-1">
                        {client.contact_name || "Sem nome"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="size-3.5" />
                        {client.contact_email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-bold px-3 py-1">
                      Login cadastrado
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-primary hover:text-primary hover:bg-primary/5 font-bold"
                      onClick={async () => {
                        try {
                          await onboarding.mutateAsync({
                            clientId: client.id,
                            email: client.contact_email!,
                            fullName: client.contact_name || "Cliente",
                            username: (client as any).profiles?.nickname || ""
                          } as any);
                          toast.success("Acesso enviado com sucesso!");
                        } catch (e) {}
                      }}
                    >
                      <Send className="size-3.5" />
                      Reenviar acesso
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
