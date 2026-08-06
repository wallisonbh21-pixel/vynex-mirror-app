import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding, useRegisterClient } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireVendedor } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { 
  Search, 
  Plus, 
  Mail,
  User,
  Calendar,
  Lock,
  Bell,
  Key,
  Building2,
  Clock,
  Filter,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerFn } from "@tanstack/react-start";
import { resendInvite } from "@/lib/onboarding.functions";
import { sendNotification } from "@/lib/client-login.functions";
import { useSession } from "@/lib/auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute('/_authenticated/vendedor/clientes-login')({
  beforeLoad: () => requireVendedor(),
  component: VendedorLoginCentral,
});

function VendedorLoginCentral() {
  const { user } = useSession();
  const { data: clients, isLoading, refetch } = useClientsList(user?.id);
  const onboarding = useClientOnboarding();
  const register = useRegisterClient();
  const resendInviteFn = useServerFn(resendInvite);
  const sendNotificationFn = useServerFn(sendNotification);
  const [searchTerm, setSearchTerm] = useState("");

  const registerFields: Field[] = [
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

  const clientsWithLogin = filteredClients?.filter(c => !!c.user_id) || [];
  const clientsWithoutLogin = filteredClients?.filter(c => !c.user_id) || [];

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
      await sendNotificationFn({ data: { userId, title: "Mensagem do seu Consultor", message, clientId } });
      toast.success("Notificação enviada com sucesso.");
    } catch (e: any) {
      toast.error("Erro ao enviar notificação.");
    }
  };

  return (
    <AppShell 
      title="Login do Cliente" 
      description="Gerencie os acessos, comunique-se e acompanhe seus clientes."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-4 rounded-2xl border border-border/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="🔎 Buscar cliente..."
              className="pl-9 bg-background/50 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <RecordDialog
            title="Novo Cliente"
            fields={registerFields}
            onSubmit={async (values) => {
              await register.mutateAsync(values);
              refetch();
            }}
            trigger={
              <Button className="gap-2 font-bold shadow-lg shadow-primary/20 rounded-xl h-10 px-6">
                <Plus className="size-4" />
                Cadastrar Cliente
              </Button>
            }
          />
        </div>

        <Tabs defaultValue="with-access" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/30 p-1 rounded-2xl mb-6">
            <TabsTrigger value="with-access" className="rounded-xl">
              Clientes com Login ({clientsWithLogin.length})
            </TabsTrigger>
            <TabsTrigger value="no-access" className="rounded-xl">
              Clientes sem acesso ({clientsWithoutLogin.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="with-access" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 rounded-3xl border bg-card animate-pulse" />)}
              </div>
            ) : clientsWithLogin.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-card/30">
                <User className="size-12 opacity-20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Nenhum cliente com login</h3>
                <p>Ative o acesso de seus clientes para que eles utilizem o portal.</p>
              </div>
            ) : (
              clientsWithLogin.map(client => {
                const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
                const username = (profile as any)?.nickname || '-';
                
                return (
                  <div key={client.id} className="p-6 rounded-3xl border border-border/50 bg-card hover:border-primary/30 transition-all">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                          <User className="size-7" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-xl">{client.contact_name}</h3>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              🟢 Ativo
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 pt-1">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="size-3.5" />
                                <span>Usuário: {username}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="size-3.5" />
                                <span>{client.contact_email}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="size-3.5" />
                                <span>{client.company || '—'}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="size-3.5" />
                                <span>Desde: {format(new Date(client.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" className="rounded-xl gap-2 font-bold" onClick={() => window.open('/cliente', '_blank')}>
                          <Lock className="size-3.5" /> Acesso
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold" onClick={() => handleResend(client.contact_email!)}>
                          <Mail className="size-3.5" /> E-mail
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold" onClick={() => handleResend(client.contact_email!)}>
                          <Key className="size-3.5" /> Senha
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold" onClick={() => handleNotify(client.id, client.user_id!, client.contact_name!)}>
                          <Bell className="size-3.5" /> Notificar
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold" onClick={() => window.location.href = '/reunioes'}>
                          <Calendar className="size-3.5" /> Reunião
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="no-access" className="mt-0 space-y-4">
            {clientsWithoutLogin.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-card/30">
                <CheckCircle className="size-12 opacity-20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Todos os seus clientes possuem acesso</h3>
              </div>
            ) : (
              clientsWithoutLogin.map(client => (
                <div key={client.id} className="p-6 rounded-3xl border border-border/50 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                      <User className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{client.contact_name}</h3>
                      <p className="text-sm text-muted-foreground">{client.company || 'Empresa não informada'} • {client.contact_email}</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full sm:w-auto gap-2 font-bold rounded-xl h-11 px-6 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-all"
                    onClick={() => {
                      const username = window.prompt("Defina um nome de usuário:", client.contact_name?.toLowerCase().replace(/\s+/g, ''));
                      if (username) {
                        onboarding.mutate({ 
                          clientId: client.id, 
                          username, 
                          email: client.contact_email!, 
                          fullName: client.contact_name! 
                        });
                      }
                    }}
                    disabled={onboarding.isPending}
                  >
                    <Plus className="size-4" /> 
                    {onboarding.isPending ? 'Cadastrando...' : 'Cadastrar Login'}
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
