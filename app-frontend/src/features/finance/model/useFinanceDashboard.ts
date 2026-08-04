import { useCallback, useEffect, useMemo, useState } from "react";
import { buildSummary, type FinanceContext, type Transaction } from "@/entities/transaction/types";
import type { Budget } from "@/entities/budget/types";
import type { Goal } from "@/entities/goal/types";
import type { HouseholdProfile } from "@/entities/finance-profile/types";
import { financeService } from "@/services/finance/finance.service";

interface FinanceDashboardState {
  transactions: readonly Transaction[];
  budgets: readonly Budget[];
  goals: readonly Goal[];
  householdProfile: HouseholdProfile | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: FinanceDashboardState = {
  transactions: [],
  budgets: [],
  goals: [],
  householdProfile: null,
  isLoading: true,
  error: null,
};

export function useFinanceDashboard(context: FinanceContext) {
  const [state, setState] = useState<FinanceDashboardState>(INITIAL_STATE);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [transactions, budgets, goals, householdProfile] = await Promise.all([
        financeService.listTransactions(context),
        financeService.listBudgets(context),
        financeService.listGoals(context),
        context === "household" ? financeService.getHouseholdProfile() : Promise.resolve(null),
      ]);

      setState({
        transactions,
        budgets,
        goals,
        householdProfile,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "No se pudieron cargar tus finanzas.",
      }));
    }
  }, [context]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => buildSummary(state.transactions), [state.transactions]);

  return {
    ...state,
    summary,
    reload: load,
  };
}
