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
      { title: "Entrar — ScaleNexus" },
      {
        name: "description",
        content: "Acesse a plataforma ScaleNexus para gerenciar leads, projetos, comissões e metas.",
      },
      { property: "og:title", content: "Entrar — ScaleNexus" },
      {
        property: "og:description",
        content: "Acesso à plataforma de operações de sites da ScaleNexus.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72),
});

type RpcClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("vendedor");
  const [adminExists, setAdminExists] = useState(true);
  const [mode, setMode] = useState<"login" | "recover">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  // Cadastro público de administrador só existe enquanto não houver nenhum.
  useEffect(() => {
    (supabase as unknown as RpcClient).rpc("admin_exists").then(({ data, error }) => {
      if (!error) setAdminExists(data !== false);
    });
  }, []);

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
    
    // Identificar o papel e redirecionar
    const { data: userResponse } = await supabase.auth.getUser();
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userResponse.user?.id || "");
      
    const roles = rolesData?.map(r => r.role) || [];
    
    if (roles.includes("cliente")) {
      navigate({ to: "/cliente", replace: true });
    } else {
      navigate({ to: "/painel", replace: true });
    }
  }


  async function recoverPassword(event: React.FormEvent) {
    event.preventDefault();
    const parsedEmail = z.string().trim().email("Informe um e-mail válido.").safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
    setMode("login");
  }

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (fullName.trim().length < 2) {
      toast.error('Preencha o campo "Nome completo".');
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

  const required = <span className="ml-1 text-destructive">*</span>;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-halo" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3 transition-opacity hover:opacity-80">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.32em]">ScaleNexus</span>
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
              {mode === "login" ? (
                <form onSubmit={signIn} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail{required}</Label>
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
                    <Label htmlFor="password">Senha{required}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full transition-transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar na plataforma"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMode("recover")}
                    className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              ) : (
                <form onSubmit={recoverPassword} noValidate className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Informe seu e-mail e enviaremos um link para criar uma nova senha.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="recover-email">E-mail{required}</Label>
                    <Input
                      id="recover-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full transition-transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Voltar para o login
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="criar" className="mt-6">
              <form onSubmit={signUp} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo{required}</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail{required}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha{required}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil{required}</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="criador">Criador</SelectItem>
                      {!adminExists ? (
                        <SelectItem value="admin">Administrador (primeiro acesso)</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  {adminExists ? (
                    <p className="text-xs text-muted-foreground">
                      Acessos administrativos são criados pelo administrador da conta.
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
                </p>
                <Button
                  type="submit"
                  className="w-full transition-transform hover:-translate-y-0.5"
                  disabled={loading}
                >
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

          <Button
            variant="secondary"
            className="w-full transition-transform hover:-translate-y-0.5"
            onClick={signInWithGoogle}
          >
            Continuar com Google
          </Button>
        </div>
      </div>
    </div>
  );
}
