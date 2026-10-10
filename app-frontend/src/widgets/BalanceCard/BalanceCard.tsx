import { useMemo } from "react";
import { getCategory } from "@/entities/category/types";
import type { FinanceSummary, Transaction } from "@/entities/transaction/types";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function BalanceCard({
  summary,
  transactions
}: {
  summary: FinanceSummary;
  transactions: readonly Transaction[];
}) {
  const expenseCategories = useMemo(() => {
    const totals = transactions
      .filter((transaction) => transaction.type === "expense" && transaction.category !== "ahorro")
      .reduce<Record<string, number>>((categories, transaction) => {
        const categoryId = getCategory(transaction.category).id;
        categories[categoryId] = (categories[categoryId] ?? 0) + transaction.amount;
        return categories;
      }, {});

    return Object.entries(totals)
      .map(([categoryId, amount]) => ({ category: getCategory(categoryId), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <SurfaceCard className="animate-in fade-in slide-in-from-bottom-1 space-y-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        Resumen
      </p>
      <div className="space-y-2">
        <Metric label="Ingresos" value={summary.income} positive />
        <Metric
          label="Gastos"
          value={summary.expenses}
          percentage={percentageOfIncome(summary.expenses, summary.income)}
        />
        <Metric
          label="Fijos"
          value={summary.fixedExpenses}
          percentage={percentageOfIncome(summary.fixedExpenses, summary.income)}
        />
        <Metric
          label={`Restante ${summary.balance < 0 ? "⚠️" : "✅"}`}
          value={summary.balance}
          percentage={percentageOfIncome(summary.balance, summary.income)}
          positive={summary.balance >= 0}
          negative={summary.balance < 0}
        />
        <Metric
          label="Ahorro"
          value={summary.savings}
          percentage={percentageOfIncome(summary.savings, summary.income)}
        />
      </div>
      {expenseCategories.length > 0 ? (
        <div className="space-y-2 border-t border-border/70 pt-3">
          <p className="text-xs font-semibold text-muted-foreground">Gastos por categoría</p>
          {expenseCategories.map(({ category, amount }) => (
            <Metric
              key={category.id}
              label={category.name}
              value={amount}
              percentage={percentageOfIncome(amount, summary.income)}
            />
          ))}
        </div>
      ) : null}
    </SurfaceCard>
  );
}

function percentageOfIncome(value: number, income: number): number {
  return income === 0 ? 0 : (value / income) * 100;
}

function Metric({
  label,
  value,
  percentage,
  positive = false,
  negative = false
}: {
  label: string;
  value: number;
  percentage?: number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {percentage !== undefined ? (
          <span className="text-[11px] text-muted-foreground">{formatPercentage(percentage)}</span>
        ) : null}
        <p
          className={
            positive
              ? "text-right text-xs font-semibold text-success"
              : negative
                ? "text-right text-xs font-semibold text-destructive"
                : "text-right text-xs font-semibold text-foreground"
          }
        >
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  );
}

function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)}%`;
}
