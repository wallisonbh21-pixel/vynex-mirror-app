import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
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
  CheckCircle,
  MoreVertical
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
  const { data: clients, isLoading, refetch } = useClientsList();
  const onboarding = useClientOnboarding();
  const resendInviteFn = useServerFn(resendInvite);
  const sendNotificationFn = useServerFn(sendNotification);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [username, setUsername] = useState("");

  const filteredClients = clients?.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (c.contact_name?.toLowerCase() || "").includes(searchLower) ||
      (c.contact_email?.toLowerCase() || "").includes(searchLower) ||
      (c.company?.toLowerCase() || "").includes(searchLower)
    );
  }) || [];

  const selectedClient = clients?.find(c => c.id === selectedClientId);

  const clientsWithLogin = filteredClients?.filter(c => !!c.user_id) || [];
  const clientsWithoutLogin = filteredClients?.filter(c => !c.user_id) || [];

  const handleCreateAccess = async () => {
    if (!selectedClient || !username) return;
    try {
      await onboarding.mutateAsync({
        clientId: selectedClient.id,
        username,
        email: selectedClient.contact_email!,
        fullName: selectedClient.contact_name || username
      });
      setIsModalOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar acesso.");
    }
  };

  return (
    <AppShell 
      title="Login do Cliente" 
      description="Gerencie os acessos, comunique-se e acompanhe seus clientes."
      actions={
        <Button className="gap-2 font-bold shadow-lg shadow-primary/20 h-10 px-6 rounded-xl" onClick={() => setIsModalOpen(true)}>
          <Plus className="size-4" />
          Abrir Painel do Cliente
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

          <TabsContent value="with-access" className="mt-0 space-y-4">
             {/* Listagem de clientes com login */}
             {clientsWithLogin.map(client => (
               <div key={client.id} className="p-6 rounded-3xl border border-border/50 bg-card">
                  {/* Card UI igual a anterior... */}
                  <h3 className="font-bold text-lg">{client.contact_name}</h3>
                  <Badge>🟢 Acesso Ativo</Badge>
                  {/* Botões... */}
               </div>
             ))}
          </TabsContent>

          <TabsContent value="no-access" className="mt-0 space-y-4">
             {clientsWithoutLogin.map(client => (
               <div key={client.id} className="p-6 rounded-3xl border border-border/50 bg-card/50 flex items-center justify-between">
                  <div>{client.contact_name}</div>
                  <Button onClick={() => { setSelectedClientId(client.id); setIsModalOpen(true); }}>
                    Criar Painel do Cliente
                  </Button>
               </div>
             ))}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Painel do Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.contact_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedClient && (
              <>
                <div className="text-sm">E-mail: {selectedClient.contact_email || <span className="text-destructive">Sem e-mail!</span>}</div>
                <div className="space-y-2">
                  <Label>Nome de usuário</Label>
                  <Input value={username} onChange={e => setUsername(e.target.value)} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateAccess} disabled={!selectedClient || !username || !selectedClient.contact_email}>Criar Painel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
