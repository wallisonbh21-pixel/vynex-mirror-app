import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({
    meta: [
      { title: "Metas — VYNEXA" },
      { name: "description", content: "Defina metas de faturamento e acompanhe o progresso do período." },
      { property: "og:title", content: "Metas — VYNEXA" },
      { property: "og:description", content: "Metas e progresso do time VYNEXA." },
    ],
  }),
  component: MetasPage,
});

type Goal = {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  period_start: string | null;
  period_end: string | null;
};

const fields: Field[] = [
  { name: "title", label: "Título da meta", required: true },
  { name: "target_value", label: "Objetivo (R$)", type: "number" },
  { name: "current_value", label: "Realizado (R$)", type: "number" },
  { name: "period_start", label: "Início", type: "date" },
  { name: "period_end", label: "Fim", type: "date" },
];

function MetasPage() {
  const { user } = useSession();
  const { data = [] } = useRows<Goal>("goals");
  const save = useSaveRow("goals");
  const remove = useDeleteRow("goals");

  return (
    <AppShell
      title="Metas"
      description="Objetivos claros para cada ciclo da operação."
      actions={
        <RecordDialog
          title="Nova meta"
          fields={fields}
          initial={{ target_value: 0, current_value: 0 }}
          onSubmit={(values) => save.mutate({ ...values, owner_id: user?.id })}
          trigger={
            <Button>
              <Plus className="size-4" /> Nova meta
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((goal) => {
          const target = Number(goal.target_value) || 0;
          const current = Number(goal.current_value) || 0;
          const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          return (
            <article key={goal.id} className="rounded-2xl border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{goal.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {shortDate(goal.period_start)} — {shortDate(goal.period_end)}
                  </p>
                </div>
                <span className="text-lg font-semibold text-primary">{percent}%</span>
              </div>
              <Progress value={percent} className="mt-4" />
              <p className="mt-3 text-sm text-muted-foreground">
                {currency(current)} de {currency(target)}
              </p>
              <div className="mt-3 flex justify-end gap-1">
                <RecordDialog
                  title="Editar meta"
                  fields={fields}
                  initial={goal}
                  onSubmit={(values) => save.mutate({ ...values, id: goal.id })}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(goal.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
        {data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground md:col-span-2">
            Nenhuma meta cadastrada ainda.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
