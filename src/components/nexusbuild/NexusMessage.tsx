import { useState } from "react";
import { Check, Copy, ExternalLink, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NexusMessage as NexusMessageType } from "@/lib/nexusbuild";

/**
 * Bolha de mensagem da NEXUSBUILD AI.
 * O corpo é renderizado em blocos simples, preparado para receber Markdown,
 * tabelas e blocos de código em uma etapa futura.
 */
export function NexusMessageBubble({ message }: { message: NexusMessageType }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const sources = Array.isArray(message.metadata?.sources)
    ? (message.metadata.sources as Array<{ title?: string; url?: string; domain?: string }>).filter(
        (source) => typeof source?.url === "string" && /^https?:\/\//i.test(source.url),
      )
    : [];

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 hidden size-8 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 sm:flex">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}

      <div className={cn("group min-w-0 max-w-[85%] sm:max-w-[70%]")}>
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card text-foreground/90",
          )}
        >
          {message.content.split("\n").map((line, i) => (
            <p key={i} className={cn("whitespace-pre-wrap break-words", line === "" && "h-2")}>
              {line}
            </p>
          ))}
          {!isUser && sources.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Fontes consultadas</p>
              <div className="flex flex-col gap-1.5">
                {sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    <span className="truncate">{source.title || source.domain || source.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isUser && (
          <button
            type="button"
            onClick={copy}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copiado" : "Copiar resposta"}
          </button>
        )}
      </div>

      {isUser && (
        <div className="mt-1 hidden size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted sm:flex">
          <User className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
