import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, MessageSquare, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { groupByPeriod, type NexusConversation } from "@/lib/nexusbuild";

export function NexusSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  backTo,
}: {
  conversations: NexusConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  backTo: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const groups = groupByPeriod(conversations);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-wide">NEXUSBUILD AI</p>
          <p className="truncate text-[11px] text-muted-foreground">Assistente do ScaleNexus</p>
        </div>
      </div>

      <Button onClick={onNew} className="w-full justify-start gap-2 rounded-xl">
        <Plus className="size-4" />
        Nova conversa
      </Button>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
        )}
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((conv) => {
                const active = conv.id === activeId;
                const editing = editingId === conv.id;
                return (
                  <li key={conv.id}>
                    {editing ? (
                      <div className="flex items-center gap-1 rounded-lg border border-primary/40 bg-card px-2 py-1">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onRename(conv.id, draft.trim() || conv.title);
                              setEditingId(null);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          aria-label="Renomear conversa"
                          className="min-w-0 flex-1 bg-transparent py-1 text-xs text-foreground outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Salvar nome"
                          onClick={() => {
                            onRename(conv.id, draft.trim() || conv.title);
                            setEditingId(null);
                          }}
                        >
                          <Check className="size-3.5 text-primary" />
                        </button>
                        <button type="button" aria-label="Cancelar" onClick={() => setEditingId(null)}>
                          <X className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
                          active ? "bg-primary/10 text-foreground" : "hover:bg-muted/60",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(conv.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <MessageSquare
                            className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                          />
                          <span className="truncate text-xs">{conv.title}</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Renomear conversa"
                          className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                          onClick={() => {
                            setEditingId(conv.id);
                            setDraft(conv.title);
                          }}
                        >
                          <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir conversa"
                          className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                          onClick={() => onDelete(conv.id)}
                        >
                          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <Link
        to={backTo}
        className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar ao painel
      </Link>
    </div>
  );
}
