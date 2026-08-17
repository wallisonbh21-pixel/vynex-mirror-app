import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, useAvatarUrl, useProfile, useRoles, useSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — ScaleNexus" },
      {
        name: "description",
        content: "Atualize seu nome, apelido, contato e foto de perfil na plataforma ScaleNexus.",
      },
      { property: "og:title", content: "Meu perfil — ScaleNexus" },
      { property: "og:description", content: "Dados pessoais e foto do seu acesso ScaleNexus." },
    ],
  }),
  component: PerfilPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Preencha o campo \"Nome completo\".").max(100),
  email: z.string().trim().email("Informe um e-mail válido."),
});

function PerfilPage() {
  const queryCliente = useQueryClient();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);
  const { primaryRole } = useRoles();

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setNickname(profile.nickname ?? "");
    setPhone(profile.phone ?? "");
    setPixKey(profile.pix_key ?? "");
  }, [profile]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ full_name: fullName, email });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setErrors({});
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        pix_key: pixKey.trim() || null,
      } as never)
      .eq("id", user!.id);

    if (!error && parsed.data.email !== user?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: parsed.data.email });
      if (emailError) {
        setSaving(false);
        toast.error("Não foi possível alterar o e-mail: " + emailError.message);
        return;
      }
      toast.info("Confirme a alteração de e-mail na sua caixa de entrada.");
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryCliente.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Perfil atualizado.");
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 3 MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: path } as never)
      .eq("id", user.id);
    setUploading(false);
    if (profileError) {
      toast.error(profileError.message);
      return;
    }
    queryCliente.invalidateQueries({ queryKey: ["profile"] });
    queryCliente.invalidateQueries({ queryKey: ["avatar"] });
    toast.success("Foto de perfil atualizada.");
  }

  const displayName = nickname || fullName || "Sem nome";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <AppShell title="Meu perfil" description="Seus dados pessoais, contato e foto na plataforma.">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-panel transition-colors hover:border-primary/40">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="mx-auto size-24 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="mx-auto flex size-24 items-center justify-center rounded-full bg-gradient-brand text-2xl font-semibold text-primary-foreground">
              {initials || <UserRound className="size-8" />}
            </span>
          )}
          <p className="mt-4 text-base font-semibold">{displayName}</p>
          <p className="text-sm text-primary">{ROLE_LABEL[primaryRole] ?? primaryRole}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>

          <label className="mt-5 block">
            <span className="sr-only">Foto de perfil</span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            <span className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary">
              {uploading ? "Enviando..." : "Alterar foto"}
            </span>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Opcional · JPG ou PNG até 3 MB</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
          <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">
                Nome completo<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={fullName}
                maxLength={100}
                onChange={(e) => setFullName(e.target.value)}
                className={errors['full_name'] ? "border-destructive" : undefined}
              />
              {errors['full_name'] ? (
                <p className="text-xs text-destructive">{errors['full_name']}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">
                E-mail<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors['email'] ? "border-destructive" : undefined}
              />
              {errors['email'] ? (
                <p className="text-xs text-destructive">{errors['email']}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido</Label>
              <Input
                id="nickname"
                value={nickname}
                maxLength={40}
                placeholder="Como quer ser chamado"
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                maxLength={30}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={pixKey}
                maxLength={120}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground sm:col-span-2">
              Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
            </p>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="transition-transform hover:-translate-y-0.5">
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
