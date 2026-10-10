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

interface DashboardSections {
  readonly transactions?: boolean;
  readonly budgets?: boolean;
  readonly goals?: boolean;
  readonly householdProfile?: boolean;
}

const INITIAL_STATE: FinanceDashboardState = {
  transactions: [],
  budgets: [],
  goals: [],
  householdProfile: null,
  isLoading: true,
  error: null
};

export function useFinanceDashboard(context: FinanceContext, month: string) {
  const [state, setState] = useState<FinanceDashboardState>(INITIAL_STATE);

  const load = useCallback(
    async (sections: DashboardSections, showLoading = false) => {
      if (showLoading) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      } else {
        setState((prev) => ({ ...prev, error: null }));
      }

      try {
        const [transactions, budgets, goals, householdProfile] = await Promise.all([
          sections.transactions ? financeService.listTransactions(context, month) : null,
          sections.budgets ? financeService.listBudgets(context, month) : null,
          sections.goals ? financeService.listGoals(context) : null,
          sections.householdProfile && context === "household"
            ? financeService.getHouseholdProfile()
            : null
        ]);

        setState((prev) => ({
          transactions: sections.transactions
            ? (transactions ?? prev.transactions)
            : prev.transactions,
          budgets: sections.budgets ? (budgets ?? prev.budgets) : prev.budgets,
          goals: sections.goals ? (goals ?? prev.goals) : prev.goals,
          householdProfile: sections.householdProfile ? householdProfile : prev.householdProfile,
          isLoading: false,
          error: null
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "No se pudieron cargar tus finanzas."
        }));
      }
    },
    [context, month]
  );

  useEffect(() => {
    void load(
      {
        transactions: true,
        budgets: true,
        goals: true,
        householdProfile: context === "household"
      },
      true
    );
  }, [context, load]);

  const summary = useMemo(() => buildSummary(state.transactions), [state.transactions]);
  const refreshTransactionsAndBudgets = useCallback(
    () => load({ transactions: true, budgets: true }),
    [load]
  );
  const refreshBudgets = useCallback(() => load({ budgets: true }), [load]);
  const refreshGoals = useCallback(() => load({ goals: true }), [load]);
  const refreshHouseholdProfile = useCallback(() => load({ householdProfile: true }), [load]);
  const retry = useCallback(
    () =>
      load(
        {
          transactions: true,
          budgets: true,
          goals: true,
          householdProfile: context === "household"
        },
        true
      ),
    [context, load]
  );

  return {
    ...state,
    summary,
    refreshTransactionsAndBudgets,
    refreshBudgets,
    refreshGoals,
    refreshHouseholdProfile,
    retry
  };
}
