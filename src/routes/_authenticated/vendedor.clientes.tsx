import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientesList, useRegisterCliente, useClienteOnboarding, useDeleteCliente } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireVendedor } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck,
  Circle,
  UserPlus,
  Lock,
  ExternalLink,
  Mail,
  Key,
  Bell,
  Calendar,
  MoreVertical,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { resendInvite } from "@/lib/onboarding.functions";
import { sendNotification } from "@/lib/client-login.functions";

export const Route = createFileRoute('/_authenticated/vendedor/clientes')({
  beforeLoad: () => requireVendedor(),
  component: VendedorClientees,
});

function VendedorClientees() {
  const { user } = useSession();
  const { data: clients, isLoading, refetch } = useClientesList(user?.id);
  const registerCliente = useRegisterCliente();
  const onboarding = useClienteOnboarding();
  const deleteCliente = useDeleteCliente();

  const resendInviteFn = useServerFn(resendInvite);
  const sendNotificationFn = useServerFn(sendNotification);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const clientRegistrationFields: Field[] = [
    { name: "contact_email", label: "E-mail *", type: "email", required: true, placeholder: "Ex: joao@email.com" },
    { name: "contact_name", label: "Nome completo", placeholder: "Opcional" },
    { name: "contact_phone", label: "Telefone", placeholder: "Opcional" },
    { name: "company", label: "Empresa/Negócio", placeholder: "Opcional" },
    { name: "notes", label: "Observações", type: "textarea", placeholder: "Opcional" },
  ];

  const handleRegisterCliente = async (values: Record<string, unknown>) => {
    try {
      const submissionData = {
        ...values,
        notes: (values as any).notes || "",
      };
      const result = await registerCliente.mutateAsync(submissionData);
      // No automatic redirection
    } catch (error) {}
  };

  const selectedCliente = clients?.find(c => c.id === selectedClienteId);
  
  const loginFields: Field[] = [
    { 
      name: "username", 
      label: "Nome de usuário", 
      required: true,
      placeholder: "Ex: joao.silva"
    }
  ];

  const handleCreateLogin = async (values: Record<string, unknown>) => {
    if (!selectedCliente) return;
    try {
      const payload = {
        clientId: selectedClienteId,
        email: selectedCliente.contact_email,
        fullName: selectedCliente.contact_name || "Clientee",
        username: values["username"] as string,
      };
      
      const result = await onboarding.mutateAsync(payload as any);
      if (result && (result as any).success) {
        toast.success((result as any).message);
        setIsLoginDialogOpen(false);
        setSelectedClienteId("");
        refetch();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar login.");
    }
  };

  const handleResend = async (email: string) => {
    try {
      const res = await resendInviteFn({ data: { email } });
      if (res && (res as any).success) toast.success((res as any).message);
    } catch (e: any) {
      toast.error(e.message || "Erro ao reenviar acesso.");
    }
  };

  const handleNotify = async (clientId: string, userId: string, name: string) => {
    const message = window.prompt(`Enviar notificação para ${name}:`);
    if (!message) return;
    try {
      await sendNotificationFn({ data: { userId, title: "Mensagem do seu Consultor", message, clientId } });
      toast.success("Notificação enviada com sucesso.");
    } catch (e: any) {
      toast.error("Erro ao enviar notificação.");
    }
  };

  const handleDelete = async (client: any) => {
    const hasAuth = !!client.user_id;
    let confirmMsg = `Tem certeza que deseja excluir o cliente "${client.contact_name}"?\nEsta ação removerá o cadastro comercial do cliente.`;
    
    if (hasAuth) {
      confirmMsg = `⚠️ ESTE CLIENTE POSSUI UM LOGIN VINCULADO!\n\n${confirmMsg}\n\nA exclusão poderá afetar o acesso ao Portal do Clientee. Deseja continuar?`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        await deleteCliente.mutateAsync(client.id);
        refetch();
      } catch (e) {}
    }
  };

  const filteredClientes = clients?.filter((c) => {

    return c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
  });

  return (
    <AppShell 
      title="Meus Clientees" 
      description="Gerencie sua carteira de clientes."
      actions={
        <RecordDialog
          title="Cadastrar Clientee"
          fields={clientRegistrationFields}
          onSubmit={handleRegisterCliente}
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Cadastrar Clientee
            </Button>
          }
        />
      }
    >
      <div className="space-y-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar meus clientes..."
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
          ) : filteredClientes?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
              Nenhum cliente encontrado em sua carteira.
            </div>
          ) : (
            filteredClientes?.map((client) => {
              const hasLogin = !!client.user_id;
              const profile = (client as any).profiles;
              const username = Array.isArray(profile) ? profile[0]?.nickname : profile?.nickname;

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
                        {hasLogin ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-bold h-5 gap-1">
                            <ShieldCheck className="size-3" />
                            Acesso Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase tracking-wider font-bold h-5 gap-1">
                            <Circle className="size-2 fill-amber-500" />
                            Sem Login
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">E-mail:</span> {client.contact_email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">Empresa:</span> {client.company || '-'}
                        </div>
                        {username && (
                           <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">User:</span> {username}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <RecordDialog
                      title="Cadastrar Login do Clientee"
                      fields={loginFields}
                      onSubmit={handleCreateLogin}
                      open={isLoginDialogOpen && selectedClienteId === client.id}
                      onOpenChange={(open) => {
                        setIsLoginDialogOpen(open);
                        if (open) setSelectedClienteId(client.id);
                      }}
                    />
                    {!hasLogin ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="gap-2 font-bold bg-primary hover:bg-primary/90"
                        onClick={() => {
                          setSelectedClienteId(client.id);
                          setIsLoginDialogOpen(true);
                        }}
                      >
                        <Lock className="size-3.5" />
                        Cadastrar Login do Clientee
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-2 font-bold"
                          onClick={() => {
                            setSelectedClienteId(client.id);
                            setIsLoginDialogOpen(true);
                          }}
                        >
                          <UserPlus className="size-3.5" /> 
                          Fazer Cadastro do Painel do Clientee
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-2 font-bold"
                          onClick={() => window.open('/cliente', '_blank')}
                        >
                          <ExternalLink className="size-3.5" /> 
                          Acessar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-1.5 font-bold"
                          onClick={() => handleResend(client.contact_email!)}
                        >
                          <Mail className="size-3.5" /> 
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-1.5 font-bold"
                          onClick={() => handleResend(client.contact_email!)}
                        >
                          <Key className="size-3.5" /> 
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-1.5 font-bold"
                          onClick={() => handleNotify(client.id, client.user_id!, client.contact_name!)}
                        >
                          <Bell className="size-3.5" /> 
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-1.5 font-bold"
                          onClick={() => window.location.href = '/reunioes'}
                        >
                          <Calendar className="size-3.5" /> 
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(client)}
                    >
                      <Trash2 className="size-4" />
                    </Button>

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