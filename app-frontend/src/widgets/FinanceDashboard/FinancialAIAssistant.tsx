import { Sparkles } from "lucide-react";
import type { FinanceSummary, Transaction } from "@/entities/transaction/types";
import { formatCurrency } from "@/shared/lib/format";

export function FinancialAIAssistant({
  summary,
  transactions
}: {
  summary: FinanceSummary;
  transactions: readonly Transaction[];
}) {
  const entertainment = transactions
    .filter(
      (transaction) => transaction.type === "expense" && transaction.category === "entretenimiento"
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
  const suggestion = Math.round(entertainment * 0.2);

  return (
    <section className="brand-gradient relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase opacity-90">
        <Sparkles className="size-4" />
        Financial AI Assistant
      </div>
      <p className="mt-3 text-sm leading-relaxed opacity-95">
        Este mes registraste {formatCurrency(summary.expenses)} en gastos. Si reduces
        entretenimiento un 20%, podrias ahorrar {formatCurrency(suggestion)} adicionales.
      </p>
    </section>
  );
}
