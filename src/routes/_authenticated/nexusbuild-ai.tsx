import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NexusSidebar } from "@/components/nexusbuild/NexusSidebar";
import { NexusComposer } from "@/components/nexusbuild/NexusComposer";
import { NexusMessageBubble } from "@/components/nexusbuild/NexusMessage";
import { requireCriadorOuAdmin } from "@/lib/guard";
import {
  deriveTitle,
  useCreateConversation,
  useDeleteConversation,
  useNexusAccess,
  useNexusConversations,
  useNexusMessages,
  useRenameConversation,
  useSendMessage,
} from "@/lib/nexusbuild";

export const Route = createFileRoute("/_authenticated/nexusbuild-ai")({
  beforeLoad: () => requireCriadorOuAdmin(),
  head: () => ({
    meta: [
      { title: "NEXUSBUILD AI — Assistente do ScaleNexus" },
      {
        name: "description",
        content:
          "Converse com a NEXUSBUILD AI, o assistente inteligente do ScaleNexus para análise de projetos, planejamento e apoio à criação.",
      },
      { property: "og:title", content: "NEXUSBUILD AI — Assistente do ScaleNexus" },
      { property: "og:description", content: "Assistente inteligente oficial da plataforma ScaleNexus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NexusBuildPage,
});

const SUGGESTIONS = [
  "Analisar meu projeto",
  "Planejar uma nova funcionalidade",
  "Me ajudar a desenvolver o ScaleNexus",
  "Analisar um problema",
  "Explicar uma funcionalidade",
];

function NexusBuildPage() {
  const { canUse, isAdmin } = useNexusAccess();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const conversations = useNexusConversations();
  const messages = useNexusMessages(activeId);
  const createConversation = useCreateConversation();
  const renameConversation = useRenameConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage(activeId);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, sendMessage.isPending]);

  const list = conversations.data ?? [];

  async function handleSend(text: string) {
    let conversationId = activeId;
    if (!conversationId) {
      const created = await createConversation.mutateAsync(deriveTitle(text));
      conversationId = created.id;
      setActiveId(created.id);
    }
    await sendMessage.mutateAsync(text, {
      onError: () => undefined,
    });
    const isFirst = (messages.data?.length ?? 0) === 0;
    if (isFirst && conversationId) {
      renameConversation.mutate({ id: conversationId, title: deriveTitle(text) });
    }
  }

  function handleDelete(id: string) {
    deleteConversation.mutate(id);
    if (id === activeId) setActiveId(null);
  }

  const sidebar = (
    <NexusSidebar
      conversations={list}
      activeId={activeId}
      onSelect={(id) => {
        setActiveId(id);
        setMobileOpen(false);
      }}
      onNew={() => {
        setActiveId(null);
        setMobileOpen(false);
      }}
      onRename={(id, title) => renameConversation.mutate({ id, title })}
      onDelete={handleDelete}
      backTo={isAdmin ? "/admin" : "/criacao"}
    />
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="hidden h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-6 lg:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir conversas">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-sidebar px-4 py-6">
              <SheetTitle className="sr-only">Conversas da NEXUSBUILD AI</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-[0.18em]">NEXUSBUILD AI</h1>
            <p className="truncate text-[11px] text-muted-foreground">
              Assistente inteligente oficial do ScaleNexus
            </p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {!canUse ? (
            <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
              Você não tem permissão para usar a NEXUSBUILD AI.
            </p>
          ) : !activeId ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">NEXUSBUILD AI</h2>
                <p className="mt-2 text-sm text-muted-foreground">Como posso ajudar você hoje?</p>
              </div>
              <div className="flex w-full flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Carregando conversa...
                </div>
              )}
              {(messages.data ?? []).map((message) => (
                <NexusMessageBubble key={message.id} message={message} />
              ))}
              {sendMessage.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> NEXUSBUILD AI está escrevendo...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        <NexusComposer
          onSend={handleSend}
          pending={sendMessage.isPending || createConversation.isPending}
          disabled={!canUse}
        />
      </div>
    </div>
  );
}
