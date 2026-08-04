import { getCategory } from "@/entities/category/types";
import type { Transaction } from "@/entities/transaction/types";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function ExpenseChart({ transactions }: { transactions: readonly Transaction[] }) {
  const expenseTotals = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
      return acc;
    }, {});

  const rows = Object.entries(expenseTotals)
    .map(([categoryId, amount]) => ({ category: getCategory(categoryId), amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const maxValue = rows[0]?.amount ?? 1;

  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">Gastos por categoria</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aun no hay gastos registrados.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const width = Math.max(10, Math.round((row.amount / maxValue) * 100));
            return (
              <div key={row.category.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{row.category.name}</span>
                  <span className="font-semibold">{formatCurrency(row.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SurfaceCard>
  );
}
