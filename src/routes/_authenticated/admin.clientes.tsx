import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList, useClientOnboarding } from "@/lib/client";
import { createFileRoute, Link } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { useSaveRow } from "@/lib/data";
import { useRegisterClient } from "@/lib/client";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Plus, 
  Search, 
  UserPlus, 
  Eye, 
  ShieldCheck,
  Circle,
  LayoutDashboard,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute('/_authenticated/admin/clientes')({
  beforeLoad: () => requireAdmin(),
  component: AdminClientes,
});

function AdminClientes() {
  const { data: clients, isLoading } = useClientsList();
  const registerClient = useRegisterClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const clientRegistrationFields: Field[] = [
    { name: "contact_name", label: "Nome completo", required: true, placeholder: "Ex: João Silva" },
    { name: "username", label: "Nome de usuário", required: true, placeholder: "Ex: joaosilva" },
    { name: "contact_email", label: "E-mail", type: "email", required: true, placeholder: "Ex: joao@email.com" },
    { name: "contact_phone", label: "Telefone", placeholder: "Ex: (11) 99999-9999" },
    { name: "company", label: "Empresa", placeholder: "Ex: Nexus Corp" },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      required: true, 
      defaultValue: "active",
      options: [
        { label: "Ativo", value: "active" },
        { label: "Inativo", value: "inactive" }
      ]
    },
  ];

  const handleRegisterClient = async (values: Record<string, unknown>) => {
    try {
      await registerClient.mutateAsync(values);
    } catch (error) {
      // toast is handled by hook
    }
  };


  const filteredClients = clients?.filter((c) => {
    const matchesSearch = 
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.contact_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "active") return matchesSearch && c.status === "active";
    if (filter === "no-project") return matchesSearch && (!c.projects || c.projects.length === 0);
    if (filter === "with-access") return matchesSearch && !!c.user_id;
    if (filter === "no-access") return matchesSearch && !c.user_id;
    return matchesSearch;
  });

  return (
    <AppShell 
      title="Gerenciamento de Clientes" 
      description="Visualize e gerencie todos os clientes da plataforma e seus acessos ao portal."
      actions={
        <RecordDialog
          title="Novo Cliente"
          fields={clientRegistrationFields}
          onSubmit={handleRegisterClient}
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Novo Cliente
            </Button>
          }
        />
      }

    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, nome ou email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilter("all")}
            >
              Todos
            </Button>
            <Button 
              variant={filter === "active" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("active")}
            >
              Ativos
            </Button>
            <Button 
              variant={filter === "no-project" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("no-project")}
            >
              Sem projeto
            </Button>
            <Button 
              variant={filter === "with-access" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("with-access")}
            >
              Com acesso
            </Button>
            <Button 
              variant={filter === "no-access" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("no-access")}
            >
              Sem acesso
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Empresa / Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Projetos</TableHead>
                <TableHead>Status Acesso</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow key={client.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{client.company}</div>
                          <div className="text-xs text-muted-foreground">{client.contact_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {client.contact_email}
                        </div>
                        <div className="text-xs text-muted-foreground">{client.contact_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.projects && client.projects.length > 0 ? (
                          client.projects.map((p: any) => (
                            <Badge key={p.id} variant="secondary" className="text-[10px] py-0">
                              {p.title}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Nenhum</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.user_id ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                          <ShieldCheck className="size-3.5" />
                          Portal Ativo
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Circle className="size-3.5" />
                          Sem Acesso
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                          <Link to="/admin/clientes-login" search={{ email: client.contact_email }}>
                            <UserPlus className="size-4" />
                          </Link>
                        </Button>
                      </div>
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
