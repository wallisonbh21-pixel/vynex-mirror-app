import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientsList } from "@/lib/client";
import { createFileRoute, Link } from '@tanstack/react-router';
import { requireVendedor } from '@/lib/guard';
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
  Eye, 
  Link as LinkIcon,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute('/_authenticated/vendedor/clientes')({
  beforeLoad: () => requireVendedor(),
  component: VendedorClientes,
});

function VendedorClientes() {
  const { user } = useSession();
  const { data: clients, isLoading } = useClientsList(user?.id);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients?.filter((c) => {
    return c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
  });

  return (
    <AppShell 
      title="Meus Clientes" 
      description="Gerencie seus clientes e acompanhe o progresso de cada projeto."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/admin/clientes-login">
              <Lock className="size-4" />
              Logins
            </Link>
          </Button>
          <Button className="gap-2">
            <Plus className="size-4" />
            Novo Cliente
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa ou nome..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Empresa / Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Projetos</TableHead>
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
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum cliente sob sua responsabilidade encontrado.
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
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <LinkIcon className="size-4" />
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
