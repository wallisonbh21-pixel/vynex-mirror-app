import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getApprovalView,
  clientApproveSite,
  clientRequestChanges,
} from "@/lib/approval.functions";

export const Route = createFileRoute("/aprovacao/$token")({
  head: () => ({
    meta: [
      { title: "Aprovação do seu site — VYNEXA" },
      {
        name: "description",
        content: "Visualize o site criado pela VYNEXA, aprove o projeto ou solicite alterações.",
      },
      { property: "og:title", content: "Aprovação do seu site — VYNEXA" },
      { property: "og:description", content: "Seu novo site está pronto para avaliação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApprovalPortal,
});

type View = "site" | "aprovar" | "alteracoes" | "aprovado" | "solicitado";

function ApprovalPortal() {
  const { token } = Route.useParams();
  const [view, setView] = useState<View>("site");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["aprovacao", token],
    queryFn: () => getApprovalView({ data: { token } }),
  });

  const approve = useMutation({
    mutationFn: () => clientApproveSite({ data: { token } }),
    onSuccess: (result) => (result.ok ? setView("aprovado") : setError(result.error)),
  });

  const request = useMutation({
    mutationFn: () => clientRequestChanges({ data: { token, message } }),
    onSuccess: (result) => (result.ok ? setView("solicitado") : setError(result.error)),
  });

  if (query.isLoading) {
    return <Centered>Carregando seu projeto…</Centered>;
  }

  const data = query.data;
  if (!data || !data.valid) {
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">Este link não é mais válido.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fale com a equipe VYNEXA para receber um novo acesso.
        </p>
      </Centered>
    );
  }

  const { project, client } = data;

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.28em]">VYNEXA</span>
            <span className="block text-[10px] tracking-[0.2em] text-muted-foreground">
              DIGITAL BUSINESS
            </span>
          </span>
        </div>

        <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-panel sm:p-9">
          {view === "aprovado" ? (
            <Result
              icon={<CheckCircle2 className="size-8 text-success" />}
              title="Site aprovado com sucesso! 🎉"
              text="Obrigado! Nossa equipe já foi avisada e dará continuidade à publicação."
            />
          ) : view === "solicitado" ? (
            <Result
              icon={<Wrench className="size-8 text-warning" />}
              title="Recebemos sua solicitação de alterações."
              text="Nossa equipe irá analisar e retornar em breve."
            />
          ) : (
            <>
              <h1 className="text-2xl font-semibold sm:text-3xl">Seu site está pronto! 🎉</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Olá{client.name ? `, ${client.name}` : ""}! O site da{" "}
                <strong className="text-foreground">{client.company || "sua empresa"}</strong> foi
                finalizado pela equipe VYNEXA e está pronto para sua avaliação.
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Info label="Projeto" value={project.title} />
                <Info label="Tipo de site" value={project.siteType ?? "Site institucional"} />
                <Info label="Empresa" value={client.company || "—"} />
                <Info
                  label="Enviado em"
                  value={
                    project.releasedAt
                      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                          new Date(project.releasedAt),
                        )
                      : "—"
                  }
                />
              </dl>

              {project.deliveryNotes ? (
                <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Observações da equipe
                  </p>
                  <p className="mt-1 text-sm">{project.deliveryNotes}</p>
                </div>
              ) : null}

              {project.deliveryLink ? (
                <Button asChild size="lg" className="mt-6 w-full text-base">
                  <a href={project.deliveryLink} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="size-5" /> Visualizar meu site
                  </a>
                </Button>
              ) : null}

              {view === "site" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Button variant="secondary" size="lg" onClick={() => setView("aprovar")}>
                    ✅ Aprovar site
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setView("alteracoes")}>
                    🔧 Solicitar alterações
                  </Button>
                </div>
              ) : null}

              {view === "aprovar" ? (
                <div className="mt-6 rounded-2xl border border-border p-4">
                  <p className="text-sm font-medium">Você confirma que o site está aprovado?</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      disabled={approve.isPending}
                      onClick={() => {
                        setError(null);
                        approve.mutate();
                      }}
                    >
                      Sim, aprovar site
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setView("site")}>
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : null}

              {view === "alteracoes" ? (
                <div className="mt-6 rounded-2xl border border-border p-4">
                  <label className="text-sm font-medium" htmlFor="alteracoes">
                    Conte para nossa equipe quais alterações você gostaria de solicitar.
                    <span className="text-destructive"> *</span>
                  </label>
                  <Textarea
                    id="alteracoes"
                    className="mt-2 min-h-32"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ex.: trocar as fotos da página inicial e ajustar o telefone de contato."
                  />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      disabled={message.trim().length < 5 || request.isPending}
                      onClick={() => {
                        setError(null);
                        request.mutate();
                      }}
                    >
                      Enviar solicitação
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setView("site")}>
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : null}

              {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
            </>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Equipe VYNEXA — Transforme oportunidades em negócios digitais.
        </p>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Result({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="py-6 text-center">
      <div className="flex justify-center">{icon}</div>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>{children}</div>
    </main>
  );
}
