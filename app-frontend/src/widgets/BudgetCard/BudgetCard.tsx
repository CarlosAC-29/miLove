import { budgetProgress, type Budget } from "@/entities/budget/types";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function BudgetCard({ budgets }: { budgets: readonly Budget[] }) {
  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">Presupuestos</h3>
      {budgets.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay presupuestos creados.</p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const progress = budgetProgress(budget);
            return (
              <div key={budget.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">{budget.name}</span>
                  <span>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
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
