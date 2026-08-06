import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireVendedor } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Building2, 
  Search, 
  UserPlus,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute('/_authenticated/vendedor/clientes-login')({
  beforeLoad: () => requireVendedor(),
  component: VendedorClientesLogin,
});

function VendedorClientesLogin() {
  const { user } = useSession();
  const { data: clients, isLoading } = useClientsList(user?.id);
  const onboarding = useClientOnboarding();
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

  const loginFields: Field[] = [
    { 
      name: "fullName", 
      label: "Cliente:", 
      defaultValue: selectedClient?.contact_name || selectedClient?.contact_email || "Cliente",
      disabled: true,
    },
    { 
      name: "email", 
      label: "E-mail:", 
      type: "email", 
      defaultValue: selectedClient?.contact_email || "",
      disabled: true,
    },
    { 
      name: "username", 
      label: "Usuário:", 
      defaultValue: pendingUsername,
      required: true,
      placeholder: "Crie o usuário de acesso"
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

  const filteredClients = clients?.filter((c) => {
    const hasNoLogin = !c.user_id;
    const isActive = c.status === 'active' || c.status === 'ativo';
    const matchesSearch = 
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    return hasNoLogin && isActive && matchesSearch;
  });

  return (
    <AppShell 
      title="Login do Cliente" 
      description="Crie e gerencie o acesso dos seus clientes ao Portal ScaleNexus."
    >
      <div className="space-y-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes sem login..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
            Meus clientes cadastrados sem login
          </h2>
          
          <div className="grid gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
              ))
            ) : filteredClients?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
                {searchTerm ? "Nenhum cliente sem login encontrado." : "Todos os seus clientes ativos já possuem acesso ao Portal."}
              </div>
            ) : (
              filteredClients?.map((client) => (
                <div key={client.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-border bg-card hover:shadow-sm transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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
      </div>
    </AppShell>
  );
}
