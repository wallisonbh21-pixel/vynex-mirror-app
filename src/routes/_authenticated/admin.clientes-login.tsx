import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Ban, 
  CheckCircle2, 
  Mail, 
  Key,
  ShieldAlert,
  MoreVertical,
  Eye
} from "lucide-react";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { resendInvite, updateLoginStatus } from "@/lib/onboarding.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute('/_authenticated/admin/clientes-login')({
  beforeLoad: () => requireAdmin(),
  component: AdminClientesLogin,
});

function AdminClientesLogin() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clients, isLoading } = useClientsList();
  const onboarding = useClientOnboarding();
  const resendInviteFn = useServerFn(resendInvite);
  const updateStatusFn = useServerFn(updateLoginStatus);
  const queryClient = useQueryClient();

  const filteredClients = clients?.filter(c => !!c.user_id && (
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ));

  const clientFields: Field[] = [
    { name: "fullName", label: "Nome Completo", placeholder: "Ex: João Silva", required: true },
    { name: "username", label: "Nome de Usuário", placeholder: "Ex: joaosilva", required: true },
    { name: "email", label: "E-mail", placeholder: "Ex: joao@empresa.com", type: "email", required: true },
    { 
      name: "clientId", 
      label: "Cliente Vinculado", 
      type: "select", 
      required: true,
      options: clients?.filter(c => !c.user_id).map(c => ({ label: c.company, value: c.id })) || []
    },
  ];

  const handleCreateAccess = async (data: any) => {
    try {
      await onboarding.mutateAsync(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleResendInvite = async (email: string) => {
    try {
      await resendInviteFn({ data: { email } });
      toast.success("Convite enviado com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao enviar convite.");
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      await updateStatusFn({ data: { userId, status } });
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success(`Status atualizado para ${status}.`);
    } catch (error: any) {
      toast.error("Erro ao atualizar status.");
    }
  };

  return (
    <AppShell 
      title="Login dos Clientes" 
      description="Gerencie os acessos dos clientes ao Portal ScaleNexus."
      actions={
        <RecordDialog
          title="Criar Acesso ao Portal"
          description="Preencha os dados abaixo para enviar um convite de acesso ao cliente."
          fields={clientFields}
          onSave={handleCreateAccess}
          isLoading={onboarding.isPending}
        >
          <Button className="gap-2">
            <Plus className="size-4" />
            Criar acesso
          </Button>
        </RecordDialog>
      }
    >
      <div className="space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar acesso..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome / Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cliente Vinculado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum login de cliente configurado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow key={client.user_id}>
                    <TableCell>
                      <div className="font-medium">{client.contact_name}</div>
                      <div className="text-xs text-muted-foreground">@{client.profiles?.nickname || 'sem-username'}</div>
                    </TableCell>
                    <TableCell className="text-sm">{client.contact_email}</TableCell>
                    <TableCell className="text-sm font-semibold">{client.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] font-bold">
                        {/* Status logic depends on database column, for now assuming Active if linked */}
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      {client.last_access ? format(new Date(client.last_access), "dd/MM/yyyy HH:mm") : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações de Acesso</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <Eye className="size-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleResendInvite(client.contact_email!)}>
                            <Mail className="size-4" /> Reenviar convite
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleUpdateStatus(client.user_id!, 'bloqueado')}>
                            <Ban className="size-4" /> Bloquear acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-emerald-500" onClick={() => handleUpdateStatus(client.user_id!, 'ativo')}>
                            <CheckCircle2 className="size-4" /> Ativar acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Key className="size-4" /> Redefinir senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <ShieldAlert className="size-4" /> Desvincular acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
