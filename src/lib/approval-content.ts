/** Texto do convite de aprovação enviado ao cliente (sem acesso ao banco). */
export function approvalEmailContent(params: { clientName: string; company: string; link: string }) {
  const subject = "🎉 Seu novo site está pronto para avaliação!";
  const text = [
    `Olá, ${params.clientName}!`,
    "",
    "Temos uma ótima notícia!",
    "",
    `O site da ${params.company} foi finalizado pela equipe ScaleNexus e está pronto para sua avaliação.`,
    "",
    `Acesse o projeto por aqui: ${params.link}`,
    "",
    "Depois de visualizar o site, você poderá aprovar o projeto ou solicitar alterações.",
    "",
    "Atenciosamente,",
    "Equipe ScaleNexus",
    "Transforme oportunidades em negócios digitais.",
  ].join("\n");
  return { subject, text };
}
