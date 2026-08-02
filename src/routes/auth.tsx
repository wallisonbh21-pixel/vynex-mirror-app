import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — VYNEXA" },
      {
        name: "description",
        content: "Acesse a plataforma VYNEXA para gerenciar leads, projetos, comissões e metas.",
      },
      { property: "og:title", content: "Entrar — VYNEXA" },
      {
        property: "og:description",
        content: "Acesso à plataforma de operações de sites da VYNEXA.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("vendedor");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (fullName.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Conta criada. Confirme o e-mail para acessar a plataforma.");
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function signInWithGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/painel", replace: true });
  }


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-halo" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.32em]">VYNEXA</span>
            <span className="block text-[10px] tracking-[0.22em] text-muted-foreground">
              DIGITAL BUSINESS
            </span>
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-panel">
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="mt-6">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar na plataforma"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar" className="mt-6">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="criador">Criador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
            Continuar com Google
          </Button>
        </div>
      </div>
    </div>
  );
}
