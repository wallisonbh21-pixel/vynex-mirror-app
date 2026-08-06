import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/cliente/primeiro-acesso")({
  head: () => ({
    meta: [
      { title: "Primeiro Acesso — ScaleNexus" }
    ],
  }),
  component: PrimeiroAcessoPage,
});

const schema = z
  .object({
    password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "As senhas não conferem",
    path: ["confirm"],
  });

function PrimeiroAcessoPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/cliente/login" });
        return;
      }
      setSession(data.session);
    });
  }, [navigate]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ password, confirm });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
      data: { must_change_password: false }
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    toast.success("Senha definida com sucesso!");
    navigate({ to: "/cliente", replace: true });
  }

  if (!session) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 bg-[#0F172A] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-halo opacity-50" />
      
      <div className="relative w-full max-w-md">
        <div className="mb-10 flex flex-col items-center justify-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-brand">
            <Sparkles className="size-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase">ScaleNexus</h1>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Crie sua nova senha</h2>
          <p className="text-white/60 text-sm mb-8">
            Para sua segurança, defina uma senha exclusiva para o seu primeiro acesso.
          </p>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-white/5 border-white/10 h-12 pl-10 focus:ring-primary rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-white/5 border-white/10 h-12 pl-10 focus:ring-primary rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all"
              disabled={loading}
            >
              {loading ? "Salvando..." : "SALVAR NOVA SENHA"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
