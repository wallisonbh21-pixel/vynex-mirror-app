export const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));

export const shortDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(`${value}`.length === 10 ? `${value}T12:00:00` : value)) : "—";

export const today = () => new Date().toISOString().slice(0, 10);

/** Funil comercial: LEAD → CONTATO → INTERESSE → PROPOSTA → NEGOCIAÇÃO → FECHADO */
export const LEAD_STATUS = [
  "novo",
  "contatado",
  "interessado",
  "proposta",
  "negociacao",
  "fechado",
  "perdido",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const PROJECT_STATUS = [
  "disponivel",
  "em_producao",
  "aguardando_aprovacao",
  "aguardando_cliente",
  "ajustes",
  "ajustes_solicitados",
  "aprovado",
  "entregue",
  "cancelado",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];
export const COMMISSION_STATUS = ["pendente", "disponivel", "pago"] as const;
export const CLIENT_STATUS = ["ativo", "pausado", "cancelado"] as const;
export const PROPOSAL_STATUS = ["rascunho", "enviada", "aceita", "recusada"] as const;
export const CONTRACT_STATUS = ["ativo", "pausado", "encerrado"] as const;
export const ACTIVITY_TYPES = ["ligacao", "whatsapp", "reuniao", "email", "observacao", "status"] as const;

export const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  interessado: "Interessado",
  proposta: "Proposta enviada",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
  fila: "Na fila",
  disponivel: "Disponível",
  em_producao: "Em produção",
  producao: "Em produção",
  aguardando_aprovacao: "Aguardando aprovação interna",
  aguardando_cliente: "Aguardando aprovação do cliente",
  ajustes: "Ajustes internos",
  ajustes_solicitados: "Ajustes solicitados pelo cliente",
  aprovado: "Aprovado",
  revisao: "Em revisão",
  entregue: "Entregue",
  ativo: "Ativo",
  pausado: "Pausado",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
  pendente: "Pendente",
  pago: "Pago",
  recusado: "Recusado",
  rascunho: "Rascunho",
  enviada: "Enviada",
  aceita: "Aceita",
  comissao: "Comissão",
  mensalidade: "Mensalidade",
  bonus: "Bônus",
  saque: "Saque",
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  email: "E-mail",
  observacao: "Observação",
  status: "Mudança de status",
};

export const label = (value: string | null | undefined) =>
  value ? (STATUS_LABEL[value] ?? value) : "—";

export const statusTone = (status: string) => {
  if (["fechado", "entregue", "ativo", "pago", "aceita", "aprovado", "disponivel"].includes(status))
    return "success" as const;
  if (["perdido", "cancelado", "recusado", "encerrado"].includes(status)) return "danger" as const;
  if (["proposta", "negociacao", "producao", "revisao", "pendente", "pausado", "enviada", "interessado", "em_producao", "aguardando_aprovacao", "aguardando_cliente", "ajustes", "ajustes_solicitados"].includes(status))
    return "warning" as const;
  return "neutral" as const;
};

export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: label(value) }));
