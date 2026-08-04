import type { FinanceSummary } from "@/entities/transaction/types";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function BalanceCard({ summary }: { summary: FinanceSummary }) {
  return (
    <SurfaceCard className="animate-in fade-in slide-in-from-bottom-1 space-y-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Disponible</p>
      <p className="text-3xl font-semibold">{formatCurrency(summary.balance)}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Ingresos" value={summary.income} positive />
        <Metric label="Gastos" value={summary.expenses} />
        <Metric label="Ahorro" value={summary.savings} positive />
      </div>
    </SurfaceCard>
  );
}

function Metric({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface px-2 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={positive ? "text-xs font-semibold text-success" : "text-xs font-semibold text-foreground"}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
