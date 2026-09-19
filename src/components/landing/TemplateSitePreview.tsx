import type { CSSProperties } from "react";
import type { TemplateModel } from "./templates-data";

type TemplateSitePreviewProps = {
  template: Pick<TemplateModel, "name" | "category" | "img" | "accent">;
  company?: string;
  compact?: boolean;
};

export function TemplateSitePreview({ template, company, compact = false }: TemplateSitePreviewProps) {
  const businessName = company?.trim() || `${template.name} Exemplo`;
  const accentStyle = { "--preview-accent": template.accent } as CSSProperties;

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#f8fafc] text-[#111827]"
      style={accentStyle}
      aria-label={`Prévia do site ${template.name}`}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-[#dbe2ea] bg-[#e9eef5] px-3">
        <span className="size-1.5 rounded-full bg-[#ef4444]" />
        <span className="size-1.5 rounded-full bg-[#f59e0b]" />
        <span className="size-1.5 rounded-full bg-[#22c55e]" />
        <div className="ml-2 h-3 flex-1 rounded-full bg-[#d2d9e3] px-2 text-[5px] leading-3 text-[#64748b]">
          {template.name.toLowerCase().replaceAll(" ", "")}.com.br
        </div>
      </div>

      <div className="flex h-8 items-center justify-between bg-[#ffffff] px-3">
        <div className="max-w-[56%] truncate text-[8px] font-black uppercase" style={{ color: template.accent }}>
          {businessName}
        </div>
        <div className="flex gap-2 text-[5px] font-bold uppercase text-[#64748b]">
          <span>Início</span><span>Serviços</span><span>Contato</span>
        </div>
      </div>

      <div className="relative h-[48%] min-h-24 overflow-hidden">
        <img src={template.img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#05070f]/55" />
        <div className="absolute inset-0 flex flex-col justify-center px-4 text-white">
          <span className="text-[6px] font-bold uppercase tracking-[0.16em]" style={{ color: template.accent }}>
            {template.category}
          </span>
          <strong className={`${compact ? "mt-1 max-w-[75%] text-sm" : "mt-1.5 max-w-[72%] text-lg"} leading-tight`}>
            {businessName}
          </strong>
          <span className="mt-2 w-fit rounded px-2 py-1 text-[6px] font-bold text-white" style={{ backgroundColor: template.accent }}>
            Conheça nosso trabalho
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[#ffffff] p-3">
        {["Qualidade", "Experiência", "Atendimento"].map((label, index) => (
          <div key={label} className="rounded border border-[#e5e7eb] bg-[#f8fafc] p-2 text-center">
            <span className="mx-auto block size-2 rounded-full" style={{ backgroundColor: index === 1 ? "#cbd5e1" : template.accent }} />
            <span className="mt-1 block truncate text-[5px] font-bold text-[#475569]">{label}</span>
          </div>
        ))}
      </div>

      {!compact ? (
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-3 bg-[#f1f5f9] px-3 py-3">
          <div>
            <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: template.accent }} />
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#cbd5e1]" />
            <div className="mt-1.5 h-1.5 w-4/5 rounded-full bg-[#dbe2ea]" />
          </div>
          <div className="rounded bg-[#ffffff] p-2">
            <div className="h-1.5 w-3/4 rounded-full bg-[#cbd5e1]" />
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e2e8f0]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}