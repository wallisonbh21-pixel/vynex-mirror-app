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
  CheckCircle2,
  Lock,
  ExternalLink,
  Key,
  Bell,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { resendInvite } from "@/lib/onboarding.functions";
import { sendNotification } from "@/lib/client-login.functions";

export const Route = createFileRoute('/_authenticated/admin/clientes')({
  beforeLoad: () => requireAdmin(),
  component: AdminClientes,
});

function AdminClientes() {
  const queryClient = useQueryClient();
  const { data: clients, isLoading, refetch } = useClientsList();
  const registerClient = useRegisterClient();
  const onboarding = useClientOnboarding();
  const resendInviteFn = useServerFn(resendInvite);
  const sendNotificationFn = useServerFn(sendNotification);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const clientRegistrationFields: Field[] = [
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
        notes: (values as any).notes || "",
      };
      const result = await registerClient.mutateAsync(submissionData);
      // Removed automatic login dialog trigger to keep user on the page as requested
    } catch (error) {}
  };

  const selectedClient = clients?.find(c => c.id === selectedClientId);
  
  const loginFields: Field[] = [
    { 
      name: "username", 
      label: "Nome de usuário", 
      required: true,
      placeholder: "Ex: joao.silva"
    }
  ];

  const handleCreateLogin = async (values: Record<string, unknown>) => {
    if (!selectedClient) return;
    try {
      const payload = {
        clientId: selectedClientId,
        email: selectedClient.contact_email,
        fullName: selectedClient.contact_name || "Cliente",
        username: values.username as string,
      };
      
      const result = await onboarding.mutateAsync(payload as any);
      if (result.success) {
        toast.success("Login do cliente criado com sucesso. Os dados de acesso foram enviados para o e-mail cadastrado.");
        setIsLoginDialogOpen(false);
        setSelectedClientId("");
        refetch();
      }
    } catch (error) {}
  };

  const handleResend = async (email: string) => {
    try {
      const res = await resendInviteFn({ data: { email } });
      if (res.success) toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message || "Erro ao reenviar acesso.");
    }
  };

  const handleNotify = async (clientId: string, userId: string, name: string) => {
    const message = window.prompt(`Enviar notificação para ${name}:`);
    if (!message) return;
    try {
      await sendNotificationFn({ data: { userId, title: "Mensagem da Administração", message, clientId } });
      toast.success("Notificação enviada com sucesso.");
    } catch (e: any) {
      toast.error("Erro ao enviar notificação.");
    }
  };

  const filteredClients = clients?.filter((c) => {
    return c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
  });

  return (
    <AppShell 
      title="Clientes" 
      description="Gerenciamento comercial de clientes."
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
              const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
              const username = (profile as any)?.nickname;

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
                            <CheckCircle2 className="size-3" />
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
                            <span className="font-medium text-foreground">Usuário:</span> {username}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!hasLogin ? (
                      <RecordDialog
                        title="Cadastrar Login do Cliente"
                        description={`Cliente: ${client.contact_name}`}
                        fields={loginFields}
                        onSubmit={handleCreateLogin}
                        open={isLoginDialogOpen && selectedClientId === client.id}
                        onOpenChange={(open) => {
                          setIsLoginDialogOpen(open);
                          if (open) setSelectedClientId(client.id);
                        }}
                        trigger={
                          <Button variant="default" size="sm" className="gap-2 font-bold bg-primary hover:bg-primary/90">
                            <Lock className="size-3.5" />
                            Cadastrar Login do Cliente
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 px-3 rounded-lg gap-2 font-bold"
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setIsLoginDialogOpen(true);
                          }}
                        >
                          <UserPlus className="size-3.5" /> 
                          Fazer Cadastro do Painel do Cliente
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="size-4" />
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