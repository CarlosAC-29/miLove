import { goalProgress, type Goal } from "@/entities/goal/types";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function GoalProgress({ goals }: { goals: readonly Goal[] }) {
  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">Metas</h3>
      {goals.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay metas creadas.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = goalProgress(goal);
            return (
              <div key={goal.id} className="rounded-xl border border-border/70 bg-surface px-3 py-2">
                <p className="text-sm font-semibold">{goal.name}</p>
                <p className="text-xs text-muted-foreground">Objetivo: {formatCurrency(goal.targetAmount)}</p>
                <p className="text-xs text-muted-foreground">Ahorrado: {formatCurrency(goal.currentAmount)}</p>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{progress}%</p>
              </div>
            );
          })}
        </div>
      )}
    </SurfaceCard>
  );
}
