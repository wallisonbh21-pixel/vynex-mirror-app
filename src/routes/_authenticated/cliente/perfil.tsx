import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClienteData } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Building, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/perfil")({
  component: MyProfile,
});

function MyProfile() {
  const { data: client, isLoading } = useClienteData();

  if (isLoading) {
    return (
      <AppShell title="Meu Perfil">
        <div className="flex justify-center py-20">
          <div className="size-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Meu Perfil">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 border border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm rounded-xl">
          <Avatar className="size-24 border-4 border-primary/20">
            <AvatarImage src="" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {client?.contact_name?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold">{client?.contact_name || "Clientee ScaleNexus"}</h2>
            <p className="text-muted-foreground">{client?.company || "Empresa Individual"}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">ID: {client?.id.slice(0, 8)}</Badge>
              <Badge variant="secondary" className="bg-blue-500/5 text-blue-500 border-blue-500/10">Role: Clientee</Badge>
            </div>
          </div>
          <Button variant="outline" className="border-sidebar-border/50">Alterar Foto</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="size-4 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={client?.contact_name || ""} className="bg-background/50 border-sidebar-border/50" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="email" defaultValue={client?.contact_email || ""} className="pl-10 bg-background/50 border-sidebar-border/50" readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="phone" defaultValue={client?.contact_phone || ""} className="pl-10 bg-background/50 border-sidebar-border/50" readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="size-4 text-primary" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Nome da Empresa</Label>
                <Input id="company" defaultValue={client?.company || ""} className="bg-background/50 border-sidebar-border/50" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Fiscal</Label>
                <Input id="address" placeholder="Não informado" className="bg-background/50 border-sidebar-border/50" readOnly />
              </div>
              <div className="mt-6 pt-6 border-t border-sidebar-border/30">
                <div className="flex items-center gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-yellow-500">
                  <Shield className="size-5 shrink-0" />
                  <p className="text-[10px] leading-tight font-medium">
                    Para alterar dados cadastrais sensíveis, entre em contato com seu gerente de conta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: string, className?: string }) {
  const variants: any = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)}>
      {children}
    </span>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
