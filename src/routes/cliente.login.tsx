
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
    meta: [
      { title: "Login — Portal do Cliente ScaleNexus" },
      { name: "description", content: "Acesse seu painel profissional no Portal do Cliente ScaleNexus." },
    ],
  }),
  component: ClientLoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o usuário ou e-mail"),
  password: z.string().min(1, "Informe a senha"),
});

function ClientLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) checkRoleAndRedirect(data.session.user.id);
    });
  }, []);

  async function checkRoleAndRedirect(userId: string) {
    const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = rolesData?.map(r => r.role) || [];
    
    if (roles.includes("cliente")) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.user_metadata?.['must_change_password']) {
        navigate({ to: "/cliente/primeiro-acesso", replace: true });
      } else {
        navigate({ to: "/cliente", replace: true });
      }
    } else {
      toast.error("Este acesso não pertence ao Portal do Cliente.");
      await supabase.auth.signOut();
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast.error("Falha na autenticação. Verifique suas credenciais.");
      return;
    }

    if (data.user) await checkRoleAndRedirect(data.user.id);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-white px-5">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary mb-4">
            <Sparkles className="size-8 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase">ScaleNexus</h1>
          <p className="text-sm text-primary font-medium">Portal do Cliente</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-6">Entre no seu painel</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Usuário / E-mail</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl"
                  placeholder="Seu usuário ou e-mail"
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
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold" disabled={loading}>
              {loading ? "Entrando..." : "ENTRAR"}
              {!loading && <ArrowRight className="ml-2 size-4" />}
            </Button>

            <div className="text-center">
              <Link to="/cliente/recuperar-senha" className="text-sm text-white/40 hover:text-primary transition-colors">
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
