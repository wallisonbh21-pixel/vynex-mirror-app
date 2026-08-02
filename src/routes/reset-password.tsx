import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — VYNEXA" },
      {
        name: "description",
        content: "Defina uma nova senha de acesso à plataforma VYNEXA com segurança.",
      },
      { property: "og:title", content: "Nova senha — VYNEXA" },
      { property: "og:description", content: "Redefinição de senha da plataforma VYNEXA." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "As senhas não conferem.",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada. Bem-vindo de volta!");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-halo" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3 transition-opacity hover:opacity-80">
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
          <h1 className="text-lg font-semibold">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? "Escolha uma nova senha para acessar a plataforma."
              : "Abra esta página pelo link enviado no seu e-mail de recuperação."}
          </p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                Nova senha<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Confirmar senha<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full transition-transform hover:-translate-y-0.5"
              disabled={loading || !ready}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>

          <Link
            to="/auth"
            className="mt-6 block text-center text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
