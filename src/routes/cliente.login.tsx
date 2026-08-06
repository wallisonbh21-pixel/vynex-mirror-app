import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/cliente/login")({
  head: () => ({
    title: "Login — Portal do Cliente ScaleNexus",
    meta: [
      { name: "description", content: "Acesse seu painel profissional no Portal do Cliente ScaleNexus." },
      { property: "og:title", content: "Login — Portal do Cliente ScaleNexus" },
      { property: "og:description", content: "Acesse seu painel profissional no Portal do Cliente ScaleNexus." },
    ],
  }),
  component: ClientLoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

function ClientLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        checkRoleAndRedirect(data.session.user.id);
      }
    });
  }, []);

  async function checkRoleAndRedirect(userId: string) {
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
      
    const roles = rolesData?.map(r => r.role) || [];
    
    if (roles.includes("cliente")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.['must_change_password']) {
        navigate({ to: "/cliente/primeiro-acesso", replace: true });
      } else {
        navigate({ to: "/cliente", replace: true });
      }
    } else {
      // Not a client, sign out or block
      toast.error("Este acesso não pertence ao Portal do Cliente.");
      await supabase.auth.signOut();
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast.error("Falha na autenticação. Verifique suas credenciais.");
      return;
    }

    if (data.user) {
      await checkRoleAndRedirect(data.user.id);
    }
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 bg-[#0F172A] text-white">
      {/* Halo Effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-halo opacity-50" />
      
      <div className="relative w-full max-w-md">
        <div className="mb-12 flex flex-col items-center justify-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-brand shadow-lg shadow-primary/20">
            <Sparkles className="size-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-[0.32em] uppercase">ScaleNexus</h1>
            <p className="text-sm tracking-[0.22em] text-primary font-medium mt-1">Portal do Cliente</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Entre para acessar seu painel</h2>
            <p className="text-white/60 text-sm mt-2">Utilize suas credenciais enviadas por e-mail.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 font-medium">Usuário (E-mail)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-white/5 border-white/10 h-12 pl-10 focus:ring-primary focus:border-primary rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 h-12 pl-10 focus:ring-primary focus:border-primary rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? "Verificando..." : "ENTRAR"}
              {!loading && <ArrowRight className="ml-2 size-4" />}
            </Button>

            <div className="pt-2">
              <Link
                to="/cliente/recuperar-senha"
                className="block text-center text-sm text-white/40 hover:text-primary transition-colors font-medium"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-white/20">
          &copy; 2026 ScaleNexus Digital Business. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
