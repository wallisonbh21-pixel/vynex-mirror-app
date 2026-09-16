import { validateBuildPlan, describeOperation, availableSectionTemplates } from "@/lib/nexus/build-plan";
import { executeBuildOperations } from "@/lib/nexus/builder.server";

// ---- Validador (puro) ----
const bad = validateBuildPlan([{ type: "CREATE_PAGE", params: {} }], 0);
console.log("1) CREATE_PAGE rejeitado:", !bad.valid, bad.issues[0]?.message);

const unknownTpl = validateBuildPlan([{ type: "ADD_SECTION", params: { template: "nao_existe" } }], 0);
console.log("2) template inexistente rejeitado:", !unknownTpl.valid, unknownTpl.issues[0]?.message);

const tooMany = validateBuildPlan(Array.from({ length: 25 }, () => ({ type: "ADD_SECTION", params: { template: "hero_modern" } })), 0);
console.log("3) limite de operações:", !tooMany.valid, tooMany.issues[0]?.message);

const destructive = validateBuildPlan([{ type: "REMOVE_SECTION", params: { section_id: "x" } }], 3);
console.log("4) destrutiva sinalizada:", destructive.valid && destructive.destructive);

const ok = validateBuildPlan(
  [
    { type: "ADD_SECTION", params: { template: "hero_modern", texts: { title: "Tênis Premium" } } },
    { type: "ADD_SECTION", params: { template: "services_grid" } },
    { type: "UPDATE_DESIGN_SYSTEM", params: { colors: { primary: "#111111" } } },
  ],
  0,
);
console.log("5) plano válido:", ok.valid, ok.operations.map(describeOperation));
console.log("6) templates reais disponíveis:", availableSectionTemplates().length);

// ---- Executor com cliente simulado (sem tocar no banco real) ----
let row: any = null;
const fake: any = {
  from(table: string) {
    const api: any = {
      _filters: {},
      select: () => api,
      eq: () => api,
      maybeSingle: async () => ({ data: row, error: null }),
      insert: async (payload: any) => {
        row = payload;
        return { error: null };
      },
      update: (payload: any) => ({
        eq: async () => {
          row = { ...row, ...payload };
          return { error: null };
        },
      }),
    };
    if (table !== "project_studio_data") throw new Error("tabela inesperada: " + table);
    return api;
  },
};

const report = await executeBuildOperations(fake, "proj-1", [
  ...ok.operations,
  { type: "UPDATE_SECTION", params: { section_id: "inexistente", texts: { title: "x" } } },
]);
console.log("7) aplicadas:", report.applied, "falhas:", report.failed);
console.log("8) falha reportada:", report.entries.find((e) => e.status === "FALHOU")?.detail);
console.log("9) seções gravadas:", report.sections);
console.log("10) validação pós-execução:", report.post_validation);
console.log("11) título aplicado:", (row.sections[0].elements[0].content as any).text);
console.log("12) design system:", row.design_system.colors.primary);
