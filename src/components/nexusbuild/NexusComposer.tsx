import { useEffect, useRef, useState } from "react";
import { Globe2, Loader2, Plus, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Campo de mensagem da NEXUSBUILD AI (Enter envia, Shift+Enter quebra linha). */
export function NexusComposer({
  onSend,
  pending,
  disabled,
}: {
  onSend: (text: string, options?: { webResearch?: boolean }) => void;
  pending: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [webResearch, setWebResearch] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || pending || disabled) return;
    onSend(text, { webResearch });
    setValue("");
    setWebResearch(false);
  }

  return (
    <div className="border-t border-border bg-background/80 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={webResearch ? "secondary" : "ghost"}
              size="icon"
              disabled={pending || disabled}
              aria-label="Mais ações"
              className="size-10 shrink-0 rounded-xl"
            >
              <Plus className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setWebResearch(true)}>
              <Globe2 className="size-4" />
              Pesquisar na web
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Converse com a NEXUSBUILD AI..."
          aria-label="Mensagem para a NEXUSBUILD AI"
          className="max-h-[200px] min-h-10 w-full resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={pending || disabled || value.trim().length === 0}
          aria-label="Enviar mensagem"
          className="size-10 shrink-0 rounded-xl"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
        </Button>
      </div>
      {webResearch && (
        <div className="mx-auto mt-2 flex w-full max-w-3xl items-center gap-2 px-2 text-xs text-primary">
          <Globe2 className="size-3.5" />
          Pesquisa na web ativada
          <Button
            type="button"
            variant="link"
            size="sm"
            className="ml-auto h-auto p-0 text-xs text-muted-foreground"
            onClick={() => setWebResearch(false)}
          >
            Remover
          </Button>
        </div>
      )}
      <p className="mx-auto mt-2 w-full max-w-3xl text-center text-[11px] text-muted-foreground">
        Enter envia • Shift + Enter quebra linha
      </p>
    </div>
  );
}
