import type { FinanceSummary } from "@/entities/transaction/types";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function BalanceCard({ summary }: { summary: FinanceSummary }) {
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
          label="Restante"
          value={summary.balance}
          percentage={percentageOfIncome(summary.balance, summary.income)}
        />
        <Metric
          label="Ahorro"
          value={summary.savings}
          percentage={percentageOfIncome(summary.savings, summary.income)}
        />
      </div>
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
  positive = false
}: {
  label: string;
  value: number;
  percentage?: number;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {percentage !== undefined ? (
          <span className="text-[11px] text-muted-foreground">
            {formatPercentage(percentage)}
          </span>
        ) : null}
        <p
          className={
            positive
              ? "text-right text-xs font-semibold text-success"
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
