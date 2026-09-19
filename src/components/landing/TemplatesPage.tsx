import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { TEMPLATE_MODELS, TEMPLATE_PRICE, type TemplateModel } from "./templates-data";

export function TemplatesPage() {
  const [selected, setSelected] = useState<TemplateModel | null>(null);
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundColor: "#05070f", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#141a2b] bg-[#05070f]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#a855f7]/15 text-sm font-black text-[#a855f7]">S</div>
            <span className="text-lg font-bold tracking-tight">ScaleNexus</span>
          </Link>
          <Link
            to="/comece-seu-projeto"
            className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Criar meu site
          </Link>
        </div>
      </header>

      <section className="px-6 pt-16 pb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa]">Modelos</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold md:text-5xl">
          12 modelos prontos para o seu negócio
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#94a3b8]">
          Escolha um modelo, coloque o nome da sua empresa e veja como o seu site vai ficar.
        </p>
      </section>

      {/* GRID 3x4 */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_MODELS.map((t, i) => (
            <motion.div
              key={t.slug}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-[#1f2937] bg-[#0f1424] transition-colors hover:border-[#3b82f6]/60"
            >
              <div className="relative">
                <img src={t.img} alt={t.name} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <span
                  className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: t.accent, backgroundColor: `${t.accent}22`, border: `1px solid ${t.accent}55` }}
                >
                  {t.badge}
                </span>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-base font-bold text-white">{t.name}</h3>
                  <p className="text-xs text-[#64748b]">{t.category}</p>
                </div>
                <p className="text-sm text-[#cbd5e1]">
                  <span className="font-bold text-white">{TEMPLATE_PRICE.setup}</span> setup
                  <span className="text-[#64748b]"> + </span>
                  <span className="font-bold text-white">{TEMPLATE_PRICE.monthly}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(t);
                    setCompany("");
                  }}
                  className="w-full rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Usar este modelo
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#1f2937] bg-[#0f1424]"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img src={selected.img} alt={selected.name} className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-center">
                  <p className="text-2xl font-bold text-white">{company.trim() || "Sua Empresa"}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: selected.accent }}>
                    {selected.name}
                  </p>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Modelo {selected.name}</h3>
                  <p className="text-sm text-[#94a3b8]">
                    {TEMPLATE_PRICE.setup} setup + {TEMPLATE_PRICE.monthly}
                  </p>
                </div>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nome da sua empresa"
                  className="w-full rounded-lg border border-[#1f2937] bg-[#0b1020] px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:border-[#3b82f6] focus:outline-none"
                />
                <Link
                  to="/comece-seu-projeto"
                  className="block w-full rounded-lg bg-[#3b82f6] px-3 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Criar meu site agora
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full text-center text-xs text-[#64748b] transition-colors hover:text-[#94a3b8]"
                >
                  Voltar aos modelos
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
