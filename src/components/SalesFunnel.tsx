import { motion } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Handshake, 
  FileText, 
  TrendingUp, 
  Trophy,
  ChevronRight,
  Target
} from "lucide-react";
import { LEAD_STATUS, label, currency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/crm";
import { useRows } from "@/lib/data";

interface SalesFunnelProps {
  leads: Lead[];
  activeStep?: string | null;
  onStepClick?: (status: string) => void;
}

interface FunnelConfig {
  color: string;
  icon: any;
  bg: string;
  border: string;
  text: string;
  label?: string;
}

export const FUNNEL_CONFIG: Record<string, FunnelConfig> = {
  ['novo']: { 
    color: "#3b82f6", 
    icon: Users, 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/20",
    text: "text-blue-500",
    label: "Novo — Aguardando Contato"
  },
  ['contatado']: { 
    color: "#8b5cf6", 
    icon: MessageSquare, 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20",
    text: "text-purple-500"
  },
  ['interessado']: { 
    color: "#f97316", 
    icon: TrendingUp, 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/20",
    text: "text-orange-500"
  },
  ['negociacao']: { 
    color: "#eab308", 
    icon: Handshake, 
    bg: "bg-yellow-500/10", 
    border: "border-yellow-500/20",
    text: "text-yellow-600"
  },
  ['proposta']: { 
    color: "#a855f7", 
    icon: FileText, 
    bg: "bg-violet-500/10", 
    border: "border-violet-500/20",
    text: "text-violet-500"
  },
  ['fechado']: { 
    color: "#22c55e", 
    icon: Trophy, 
    bg: "bg-green-500/10", 
    border: "border-green-500/20",
    text: "text-green-500"
  },
  ['perdido']: { 
    color: "#ef4444", 
    icon: CheckCircle2, 
    bg: "bg-red-500/10", 
    border: "border-red-500/20",
    text: "text-red-500"
  },
};

const DEFAULT_CONFIG: FunnelConfig = FUNNEL_CONFIG['novo']!;

export function SalesFunnel({ leads, activeStep, onStepClick }: SalesFunnelProps) {
  const counts = LEAD_STATUS.map((status) => {
    const rows = leads.filter((l) => l.status === status);
    const value = rows.reduce((sum, l) => sum + Number(l.closed_value || l.estimated_value), 0);
    return { status, count: rows.length, value };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        {counts.filter(c => c.status !== 'perdido').map((item, index, filteredCounts) => {
          const config = (FUNNEL_CONFIG[item.status as string] || DEFAULT_CONFIG) as FunnelConfig;
          const Icon = config.icon;
          const funnelWidth = 100 - index * 6;
          const isActive = activeStep === item.status;
          
          const prevCount = index > 0 ? (filteredCounts[index - 1]?.count || 0) : 0;
          const conversionRate = index === 0 ? 100 : (prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0);

          return (
            <motion.button
              key={item.status}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onStepClick?.(item.status)}
              className={cn(
                "group relative mx-auto flex h-16 w-full items-center justify-between rounded-xl border px-6 transition-all",
                config.bg,
                config.border,
                isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:bg-opacity-20 shadow-sm"
              )}
              style={{ maxWidth: `${funnelWidth}%` }}
            >
              <div className="flex items-center gap-4">
                <div className={cn("flex size-10 items-center justify-center rounded-lg bg-background shadow-sm", config.text)}>
                  <Icon size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-foreground">
                    {item.status === 'novo' ? 'Novo — Aguardando Contato' : label(item.status)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {index > 0 ? `${conversionRate}% conversão` : 'Entrada'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="block text-lg font-mono font-bold leading-none">
                    {item.count}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Leads
                  </span>
                </div>
                <div className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold text-foreground">
                    {currency(item.value)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Valor Potencial
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              
              <div className="absolute -bottom-4 left-1/2 h-4 w-px -translate-x-1/2 bg-border/50" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface ProgressionLineProps {
  steps: string[];
  currentStep?: string | null;
  onStepClick?: (status: string) => void;
  leads: Lead[];
}

export function ProgressionLine({ steps, currentStep, onStepClick, leads }: ProgressionLineProps) {
  const currentIndex = currentStep ? steps.indexOf(currentStep) : -1;

  return (
    <div className="relative py-8 px-4">
      <div className="absolute left-8 right-8 top-1/2 h-0.5 -translate-y-1/2 bg-border sm:left-12 sm:right-12" />
      
      <div className="relative flex justify-between">
        {steps.map((status, index) => {
          const config = FUNNEL_CONFIG[status] || DEFAULT_CONFIG;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const stepLeads = leads.filter(l => l.status === status);

          return (
            <div key={status} className="flex flex-col items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => onStepClick?.(status)}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border-2 transition-all sm:size-10",
                  isCompleted && "border-primary bg-primary text-primary-foreground shadow-lg",
                  isCurrent && cn("size-10 border-primary bg-background text-primary shadow-xl ring-4 sm:size-12", config.text),
                  isFuture && "border-muted bg-background text-muted-foreground hover:border-border"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Target size={20} />
                  </motion.div>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
                
                {isCurrent && (
                  <span className="absolute -top-7 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-primary">
                    Etapa Atual
                  </span>
                )}
              </motion.button>
              
              <div className="flex flex-col items-center text-center">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tight sm:text-xs",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {label(status).split(' ')[0]}
                </span>
                <span className="hidden text-[10px] text-muted-foreground sm:block">
                  {stepLeads.length} leads
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeadFunnelCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { data: attributions } = useRows<any>("lead_attribution");
  const { data: profiles } = useRows<any>("profiles" as any);
  const attribution = attributions?.find(a => a.lead_id === lead.id);

  const getProfileName = (id: string) => {
    const p = profiles?.find((p: any) => p.id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  const allSteps = LEAD_STATUS.filter(s => s !== 'perdido');
  const currentIndex = allSteps.indexOf(lead.status as any);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 overflow-hidden">
          <button 
            onClick={onOpen}
            type="button"
            className="truncate text-left font-bold text-foreground hover:text-primary transition-colors"
          >
            {lead.company || lead.name}
          </button>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Users size={12} />
            <span className="truncate">{lead.name}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary">
            {currency(lead.closed_value || lead.estimated_value)}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">
            Valor
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-primary">{lead.status === 'novo' ? 'Novo — Aguardando Contato' : label(lead.status)}</span>
          <span className="text-muted-foreground">{currentIndex + 1} de {allSteps.length}</span>
        </div>
        <div className="flex h-1 gap-1 overflow-hidden rounded-full bg-secondary/50">
          {allSteps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-full flex-1 transition-all",
                i <= currentIndex ? "bg-primary" : "bg-transparent"
              )} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px]">
        <div className="space-y-0.5">
          <div className="text-muted-foreground uppercase">Origem</div>
          <div className="font-medium truncate">{lead.source || 'Direto'}</div>
        </div>
        <div className="space-y-0.5 text-right">
          <div className="text-muted-foreground uppercase">Próximo</div>
          <div className="font-medium">{lead.next_contact_at ? new Date(lead.next_contact_at).toLocaleDateString() : 'Não agendado'}</div>
        </div>
      </div>
      
      {attribution && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-[9px] text-muted-foreground">
          <div className="truncate">
            <span className="opacity-70">Indicado por:</span> {getProfileName(attribution.originator_id)}
          </div>
          <div className="text-right truncate">
            <span className="opacity-70">Responsável:</span> {getProfileName(attribution.current_responsible_id)}
          </div>
        </div>
      )}
      
      <button 
        onClick={onOpen}
        type="button"
        className="absolute inset-0 z-0 cursor-pointer"
      />
    </motion.article>
  );
}