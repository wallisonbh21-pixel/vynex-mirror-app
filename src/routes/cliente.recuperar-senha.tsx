import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/cliente/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar Senha — Portal do Clientee ScaleNexus" }
    ],
  }),
  component: ClienteRecoverPage,
});

function ClienteRecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success("E-mail de recuperação enviado!");
  }

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
          {sent ? (
            <div className="text-center py-4 space-y-6">
              <div className="mx-auto size-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="size-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Verifique seu e-mail</h2>
                <p className="text-white/60">
                  Enviamos as instruções de recuperação para <strong>{email}</strong>.
                </p>
              </div>
              <Button asChild variant="link" className="text-primary hover:text-primary/80">
                <Link to="/cliente/login">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Esqueceu sua senha?</h2>
              <p className="text-white/60 text-sm mb-8">
                Informe seu e-mail de acesso e enviaremos um link para criar uma nova senha.
              </p>

              <form onSubmit={handleRecover} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de cadastro</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="bg-white/5 border-white/10 h-12 pl-10 focus:ring-primary rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "ENVIAR LINK"}
                </Button>

                <div className="pt-2">
                  <Link
                    to="/cliente/login"
                    className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-primary transition-colors font-medium"
                  >
                    <ArrowLeft className="size-3.5" />
                    Voltar para o login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
