import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { requireVendedor } from '@/lib/guard';
import { AppShell } from "@/components/AppShell";
import { useState, useMemo } from "react";
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
  Ban, 
  CheckCircle2, 
  Mail, 
  Key,
  MoreVertical
} from "lucide-react";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { useQueryClient } from "@tanstack/react-query";
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
import { useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute('/_authenticated/vendedor/clientes-login')({
  beforeLoad: () => requireVendedor(),
  component: VendedorClientesLogin,
});

function VendedorClientesLogin() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const { data: clients, isLoading } = useClientsList(user?.id);
  const onboarding = useClientOnboarding();
  const resendInviteFn = useServerFn(resendInvite);
  const updateStatusFn = useServerFn(updateLoginStatus);
  const queryClient = useQueryClient();

  const filteredLogins = useMemo(() => {
    return (clients as any[])?.filter(c => !!c.user_id && (
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    ));
  }, [clients, searchTerm]);

  const availableClients = useMemo(() => {
    return (clients as any[])?.filter(c => !c.user_id && (c.status === 'ativo' || c.status === 'active')) || [];
  }, [clients]);

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const selectedClient = useMemo(() => availableClients.find(c => c.id === selectedClientId), [availableClients, selectedClientId]);

  const clientFields: Field[] = [
    { 
      name: "clientId", 
      label: "Cliente", 
      type: "select", 
      required: true,
      options: availableClients.map(c => ({ label: c.company, value: c.id })),
      onChange: (val) => setSelectedClientId(val as string)
    },
    { 
      name: "fullName", 
      label: "Nome completo", 
      required: true,
      defaultValue: selectedClient?.contact_name || "",
      disabled: true,
      placeholder: "Selecione um cliente..."
    },

    { 
      name: "username", 
      label: "Nome de usuário", 
      placeholder: "Ex: joaosilva", 
      required: true 
    },
    { 
      name: "email", 
      label: "E-mail", 
      type: "email", 
      required: true,
      defaultValue: selectedClient?.contact_email || "",
      disabled: true,
      placeholder: "Selecione um cliente..."
    },

  ];

  const handleCreateAccess = async (values: Record<string, unknown>) => {
    try {
      await onboarding.mutateAsync(values as any);
      toast.success("Login do cliente criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao criar acesso.");
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
      title="Login do Cliente" 
      description="Crie e gerencie o acesso dos seus clientes ao Portal do Cliente."
      actions={
        availableClients.length > 0 ? (
          <RecordDialog
            title="Criar Login do Cliente"
            fields={clientFields}
            onSubmit={handleCreateAccess}
            trigger={
              <Button className="gap-2" disabled={onboarding.isPending}>
                <Plus className="size-4" />
                {onboarding.isPending ? "Criando..." : "Criar Login do Cliente"}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-muted-foreground bg-muted/20">
              Nenhum cliente disponível para criar login.
            </Badge>
            <Link to="/vendedor/clientes" className="text-[10px] text-primary hover:underline font-medium">
              Cadastre ou ative um cliente primeiro.
            </Link>
          </div>
        )
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
                <TableHead>Cliente</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status do acesso</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-12 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : filteredLogins?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum login de cliente configurado sob sua responsabilidade.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogins?.map((client) => (
                  <TableRow key={client.user_id}>
                    <TableCell>
                      <div className="font-semibold">{client.company}</div>
                      <div className="text-xs text-muted-foreground">{client.contact_name}</div>
                    </TableCell>
                    <TableCell className="text-sm">{client.contact_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "capitalize text-[10px] font-bold",
                        client.status === 'bloqueado' ? "border-destructive text-destructive" : 
                        client.status === 'pendente' ? "border-amber-500 text-amber-500" : 
                        "border-emerald-500 text-emerald-500"
                      )}>
                        {client.status || 'Ativo'}
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
                          <DropdownMenuItem className="gap-2" onClick={() => handleResendInvite(client.contact_email!)}>
                            <Mail className="size-4" /> Reenviar convite
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleUpdateStatus(client.user_id!, 'bloqueado')}>
                            <Ban className="size-4" /> Bloquear acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-emerald-500" onClick={() => handleUpdateStatus(client.user_id!, 'ativo')}>
                            <CheckCircle2 className="size-4" /> Ativar acesso
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
