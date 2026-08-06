import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
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
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerFn } from "@tanstack/react-start";
import { resendInvite } from "@/lib/onboarding.functions";
import { sendNotification } from "@/lib/client-login.functions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute('/_authenticated/admin/clientes-login')({
  beforeLoad: () => requireAdmin(),
  component: AdminLoginCentral,
});

function AdminLoginCentral() {
  const { data: allClients, isLoading, isError, error, refetch } = useClientsList();
  
  // LOG OBRIGATÓRIO PARA DIAGNÓSTICO
  console.log("DIAGNÓSTICO ADMIN - CLIENTS RECEIVED:", allClients ? allClients.map(c => ({
    id: c.id,
    name: c.contact_name,
    email: c.contact_email,
    status: c.status,
    owner_id: c.owner_id
  })) : "null/undefined");
  
  const activeClients = useMemo(() => {
    const total = allClients?.length || 0;
    const afterStatus = allClients?.filter(c => c.status === "ativo") || [];
    
    console.log("DIAGNÓSTICO ADMIN - FILTROS:", {
      total_recebido: total,
      total_apos_filtro_status: afterStatus.length,
      status_usado: "ativo"
    });

    return afterStatus;
  }, [allClients]);
  
  const clients = allClients;
  const onboarding = useClientOnboarding();
  const resendInviteFn = useServerFn(resendInvite);
  const sendNotificationFn = useServerFn(sendNotification);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [username, setUsername] = useState("");

  const filteredClients = useMemo(() => {
    return clients?.filter((c) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (c.contact_name?.toLowerCase() || "").includes(searchLower) ||
        (c.contact_email?.toLowerCase() || "").includes(searchLower) ||
        (c.company?.toLowerCase() || "").includes(searchLower)
      );
    }) || [];
  }, [clients, searchTerm]);

  const selectedClient = useMemo(() => clients?.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  const clientsWithLogin = useMemo(() => filteredClients.filter(c => !!c.user_id), [filteredClients]);
  const clientsWithoutLogin = useMemo(() => filteredClients.filter(c => !c.user_id), [filteredClients]);

  const handleCreateAccess = async () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!username) {
      toast.error("Informe um nome de usuário.");
      return;
    }
    if (!selectedClient.contact_email) {
      toast.error("Este cliente não possui e-mail cadastrado. Cadastre um e-mail no cadastro do cliente antes de criar o acesso.");
      return;
    }

    try {
      await onboarding.mutateAsync({
        clientId: selectedClient.id,
        username,
        email: selectedClient.contact_email,
        fullName: selectedClient.contact_name || username
      });
      setIsModalOpen(false);
      setSelectedClientId("");
      setUsername("");
      refetch();
    } catch (e: any) {
      // toast is handled by mutation
    }
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

  const handleOpenModal = (clientId?: string) => {
    if (clientId) {
      setSelectedClientId(clientId);
      const client = clients?.find(c => c.id === clientId);
      setUsername(client?.contact_name?.toLowerCase().replace(/\s+/g, '') || "");
    } else {
      setSelectedClientId("");
      setUsername("");
    }
    setIsModalOpen(true);
  };

  return (
    <AppShell 
      title="Login do Cliente" 
      description="Gerencie os acessos, comunique-se e acompanhe seus clientes."
      actions={
        <Button className="gap-2 font-bold shadow-lg shadow-primary/20 h-10 px-6 rounded-xl" onClick={() => handleOpenModal()}>
          <Plus className="size-4" />
          ABRIR PAINEL DO CLIENTE
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-card/50 p-4 rounded-2xl border border-border/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="🔎 Buscar cliente..."
              className="pl-9 bg-background/50 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

          <TabsContent value="with-access" className="mt-0 space-y-4 outline-none">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl border bg-card animate-pulse" />)}
              </div>
            ) : clientsWithLogin.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-card/30">
                <User className="size-12 opacity-20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Nenhum cliente com login</h3>
                <p>Tente ativar o acesso de um cliente comercial.</p>
              </div>
            ) : (
              clientsWithLogin.map(client => {
                const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
                const usernameDisplay = (profile as any)?.nickname || '-';
                
                return (
                  <div key={client.id} className="p-6 rounded-3xl border border-border/50 bg-card hover:border-primary/30 transition-all">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                          <User className="size-7" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-xl tracking-tight">{client.contact_name}</h3>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              🟢 Acesso Ativo
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 pt-1">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="size-3.5 text-primary/60" />
                                <span className="font-medium text-foreground/80">Usuário:</span> {usernameDisplay}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="size-3.5 text-primary/60" />
                                <span className="font-medium text-foreground/80">E-mail:</span> {client.contact_email}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="size-3.5 text-primary/60" />
                                <span className="font-medium text-foreground/80">Empresa:</span> {client.company || '—'}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="size-3.5 text-primary/60" />
                                <span className="font-medium text-foreground/80">Criação:</span> {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl gap-2 font-bold"
                          onClick={() => window.open('/cliente', '_blank')}
                        >
                          <Lock className="size-3.5" /> ABRIR PAINEL
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl gap-2 font-bold border-border/50 hover:border-primary/30"
                          onClick={() => handleResend(client.contact_email!)}
                        >
                          <Mail className="size-3.5" /> ENVIAR E-MAIL
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl gap-2 font-bold border-border/50 hover:border-primary/30"
                          onClick={() => handleResend(client.contact_email!)}
                        >
                          <Key className="size-3.5" /> TROCAR SENHA
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl gap-2 font-bold border-border/50 hover:border-primary/30"
                          onClick={() => handleNotify(client.id, client.user_id!, client.contact_name!)}
                        >
                          <Bell className="size-3.5" /> NOTIFICAR CLIENTE
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl gap-2 font-bold border-border/50 hover:border-primary/30"
                          onClick={() => window.location.href = '/reunioes'}
                        >
                          <Calendar className="size-3.5" /> REUNIÃO
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="no-access" className="mt-0 space-y-4 outline-none">
            {clientsWithoutLogin.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-card/30">
                <CheckCircle className="size-12 opacity-20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Todos os clientes possuem acesso</h3>
              </div>
            ) : (
              clientsWithoutLogin.map(client => (
                <div key={client.id} className="p-6 rounded-3xl border border-border/50 bg-card/50 hover:bg-card transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
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
                    onClick={() => handleOpenModal(client.id)}
                    disabled={onboarding.isPending}
                  >
                    <Plus className="size-4" /> 
                    {onboarding.isPending ? 'Cadastrando...' : 'CRIAR PAINEL DO CLIENTE'}
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ABRIR PAINEL DO CLIENTE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">CLIENTE</Label>
              <Select value={selectedClientId} onValueChange={(val) => {
                setSelectedClientId(val);
                const c = clients?.find(x => x.id === val);
                if (c) setUsername(c.contact_name?.toLowerCase().replace(/\s+/g, '') || "");
              }}>
                <SelectTrigger id="client-select" className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecionar cliente ▼" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Carregando clientes...</div>
                  ) : isError ? (
                    <div className="p-2 text-sm text-destructive text-center font-bold">Erro ao carregar clientes.</div>
                  ) : clients?.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center font-bold">Não existem clientes ativos cadastrados.</div>
                  ) : (
                    clients?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contact_name || 'Sem nome'} | {c.contact_email || 'Sem e-mail'} | {c.company || 'Sem empresa'} | Status: {c.status}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedClient && (
              <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente:</Label>
                  <p className="font-semibold">{selectedClient.contact_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">E-mail:</Label>
                  <p className="font-semibold">{selectedClient.contact_email || <span className="text-destructive font-normal italic">Não cadastrado!</span>}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Empresa:</Label>
                  <p className="font-semibold">{selectedClient.company || "—"}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">NOME DE USUÁRIO</Label>
              <Input 
                id="username"
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Ex: joao123"
                className="h-11 rounded-xl"
              />
            </div>

            {selectedClient && selectedClient.user_id && (
              <p className="text-xs text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="size-4" />
                Este cliente já possui acesso ao Portal do Cliente.
              </p>
            )}

            {selectedClient && !selectedClient.contact_email && (
              <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20">
                Este cliente não possui e-mail cadastrado. Cadastre um e-mail no cadastro do cliente antes de criar o acesso.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-11 rounded-xl font-bold gap-2"
              onClick={handleCreateAccess} 
              disabled={onboarding.isPending || !selectedClient || !username || !selectedClient.contact_email}
            >
              {onboarding.isPending ? 'PROCESSANDO...' : selectedClient?.user_id ? 'GERENCIAR ACESSO' : 'CRIAR PAINEL DO CLIENTE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
