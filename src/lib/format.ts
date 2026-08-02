export const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));

export const shortDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "—";

export const LEAD_STATUS = ["novo", "contato", "proposta", "ganho", "perdido"] as const;
export const PROJECT_STATUS = ["fila", "producao", "revisao", "entregue"] as const;
export const CLIENT_STATUS = ["ativo", "pausado", "cancelado"] as const;

export const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contato: "Em contato",
  proposta: "Proposta",
  ganho: "Ganho",
  perdido: "Perdido",
  fila: "Na fila",
  producao: "Em produção",
  revisao: "Em revisão",
  entregue: "Entregue",
  ativo: "Ativo",
  pausado: "Pausado",
  cancelado: "Cancelado",
  pendente: "Pendente",
  pago: "Pago",
  recusado: "Recusado",
  comissao: "Comissão",
  mensalidade: "Mensalidade",
  bonus: "Bônus",
  saque: "Saque",
};

export const statusTone = (status: string) => {
  if (["ganho", "entregue", "ativo", "pago"].includes(status)) return "success" as const;
  if (["perdido", "cancelado", "recusado"].includes(status)) return "danger" as const;
  if (["proposta", "producao", "revisao", "pendente", "pausado"].includes(status)) return "warning" as const;
  return "neutral" as const;
};
