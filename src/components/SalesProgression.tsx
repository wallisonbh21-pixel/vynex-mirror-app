import { useMemo } from "react";
import { cn } from "@/lib/utils";

export const PROJECT_STATUS_STEPS = [
  { id: "disponivel", label: "Disponível" },
  { id: "briefing", label: "Briefing" },
  { id: "production", label: "Criação" },
  { id: "revision", label: "Revisão" },
  { id: "adjustments", label: "Ajustes" },
  { id: "approval", label: "Aprovação" },
  { id: "delivered", label: "Entrega" },
];

export const LEAD_STATUS_STEPS = [
  { id: "novo", label: "Novo" },
  { id: "contato", label: "Contato" },
  { id: "reuniao", label: "Reunião" },
  { id: "proposta", label: "Proposta" },
  { id: "negociacao", label: "Negociação" },
  { id: "fechado", label: "Fechado" },
];

export const APPROVAL_STATUS_STEPS = [
  { id: "interna", label: "Revisão Interna" },
  { id: "liberado", label: "Com Clientee" },
  { id: "ajustes_cliente", label: "Ajustes" },
  { id: "aprovado", label: "Aprovado" },
];

interface SalesProgressionProps {
  status: string;
}

export function SalesProgression({ status }: SalesProgressionProps) {
  const steps = useMemo(() => {
    if (LEAD_STATUS_STEPS.some(s => s.id === status)) return LEAD_STATUS_STEPS;
    if (APPROVAL_STATUS_STEPS.some(s => s.id === status)) return APPROVAL_STATUS_STEPS;
    return PROJECT_STATUS_STEPS;
  }, [status]);
  const currentStepId = status;
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted-foreground/20" />
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const active = idx <= currentIndex;
          const current = idx === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                  active 
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {active && !current ? (
                  <div className="size-2 rounded-full bg-current" />
                ) : (
                  <div className={cn("size-2 rounded-full", current ? "bg-current" : "bg-transparent")} />
                )}
              </div>
              <span 
                className={cn(
                  "absolute top-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-12 text-center">
        <p className="text-xs text-muted-foreground">
          Clientee está atualmente em: <span className="font-bold text-primary uppercase tracking-wider">{steps[currentIndex]?.label}</span>
        </p>
      </div>
    </div>
  );
}
