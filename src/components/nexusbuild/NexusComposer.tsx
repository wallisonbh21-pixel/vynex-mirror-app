import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Campo de mensagem da NEXUSBUILD AI (Enter envia, Shift+Enter quebra linha). */
export function NexusComposer({
  onSend,
  pending,
  disabled,
}: {
  onSend: (text: string) => void;
  pending: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
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
    onSend(text);
    setValue("");
  }

  return (
    <div className="border-t border-border bg-background/80 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/40">
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
      <p className="mx-auto mt-2 w-full max-w-3xl text-center text-[11px] text-muted-foreground">
        Enter envia • Shift + Enter quebra linha
      </p>
    </div>
  );
}
