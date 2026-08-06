import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinanceContext, FinanceSummary, Transaction } from "@/entities/transaction/types";
import { financeService } from "@/services/finance/finance.service";
import { formatCurrency } from "@/shared/lib/format";

export function FinancialAIAssistant({
  summary,
  transactions,
  context,
  month
}: {
  summary: FinanceSummary;
  transactions: readonly Transaction[];
  context: FinanceContext;
  month: string;
}) {
  const entertainment = transactions
    .filter(
      (transaction) => transaction.type === "expense" && transaction.category === "entretenimiento"
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
  const suggestion = Math.round(entertainment * 0.2);
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(true);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingInsight(true);
    setInsight(null);

    void financeService
      .getInsights(context, month, suggestionIndex)
      .then((insights) => {
        if (isCurrent) setInsight(insights[0]?.message ?? null);
      })
      .catch(() => {
        if (isCurrent) setInsight(null);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingInsight(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [context, month, suggestionIndex]);

  return (
    <section className="brand-gradient relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase opacity-90">
        <Sparkles className="size-4" />
        Financial AI Assistant
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed opacity-95">
          {isLoadingInsight ? (
            <span className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Actualizando recomendación...
            </span>
          ) : (
            insight ??
            `Este mes registraste ${formatCurrency(summary.expenses)} en gastos. Si reduces entretenimiento un 20%, podrias ahorrar ${formatCurrency(suggestion)} adicionales.`
          )}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0 rounded-xl"
          onClick={() => setSuggestionIndex((index) => index + 1)}
          disabled={isLoadingInsight}
        >
          {isLoadingInsight ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          <span>Cambiar</span>
        </Button>
      </div>
    </section>
  );
}
