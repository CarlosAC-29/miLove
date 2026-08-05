import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type FinanceContext, type Transaction } from "@/entities/transaction/types";
import { ContributionManager } from "@/features/finance/household/manageContributions/ContributionManager";
import { HouseholdTransactionForm } from "@/features/finance/household/addSharedExpense/HouseholdTransactionForm";
import { HouseholdBudgetForm } from "@/features/finance/household/createHouseholdBudget/HouseholdBudgetForm";
import { SharedGoalForm } from "@/features/finance/household/createSharedGoal/SharedGoalForm";
import { useEditSharedExpense } from "@/features/finance/household/editSharedExpense/useEditSharedExpense";
import { PersonalTransactionForm } from "@/features/finance/personal/addTransaction/PersonalTransactionForm";
import { PersonalBudgetForm } from "@/features/finance/personal/createBudget/PersonalBudgetForm";
import { PersonalGoalForm } from "@/features/finance/personal/createGoal/PersonalGoalForm";
import { useDeletePersonalTransaction } from "@/features/finance/personal/deleteTransaction/useDeletePersonalTransaction";
import { useEditPersonalTransaction } from "@/features/finance/personal/editTransaction/useEditPersonalTransaction";
import { useFinanceDashboard } from "@/features/finance/model/useFinanceDashboard";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";
import { BalanceCard } from "@/widgets/BalanceCard/BalanceCard";
import { BudgetCard } from "@/widgets/BudgetCard/BudgetCard";
import { ExpenseChart } from "@/widgets/ExpenseChart/ExpenseChart";
import { GoalProgress } from "@/widgets/GoalProgress/GoalProgress";
import { TransactionList } from "@/widgets/TransactionList/TransactionList";
import { FinancialAIAssistant } from "./FinancialAIAssistant";

export function FinanceDashboard({ context }: { context: FinanceContext }) {
  const { transactions, budgets, goals, householdProfile, summary, isLoading, error, reload } =
    useFinanceDashboard(context);
  const { deletePersonalTransaction } = useDeletePersonalTransaction(reload);
  const { editPersonalTransaction } = useEditPersonalTransaction(reload);
  const { editSharedExpense } = useEditSharedExpense(reload);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (transactionId: string) => {
    setActionError(null);
    try {
      await deletePersonalTransaction(transactionId);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo eliminar la transaccion."
      );
    }
  };

  const handleQuickEdit = async (transaction: Transaction) => {
    setActionError(null);
    const updatedDescription = `${transaction.description} (editado)`;
    try {
      if (context === "personal") {
        await editPersonalTransaction(transaction.id, { description: updatedDescription });
        return;
      }
      await editSharedExpense(transaction.id, { description: updatedDescription });
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo editar la transaccion."
      );
    }
  };

  if (isLoading) {
    return (
      <SurfaceCard>
        <div className="space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
        </div>
      </SurfaceCard>
    );
  }

  if (error) {
    return (
      <SurfaceCard className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Reintentar
        </Button>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {context === "household" ? (
        <SurfaceCard className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Finanzas del hogar
          </p>
          <h2 className="text-xl">{householdProfile?.name ?? "Hogar"}</h2>
        </SurfaceCard>
      ) : null}

      <BalanceCard summary={summary} />
      <FinancialAIAssistant summary={summary} transactions={transactions} />
      <ExpenseChart transactions={transactions} />
      <TransactionList
        transactions={transactions}
        onDelete={context === "personal" ? handleDelete : undefined}
        onEdit={handleQuickEdit}
      />
      <BudgetCard budgets={budgets} />
      <GoalProgress goals={goals} />

      {context === "household" ? (
        <SurfaceCard className="space-y-3">
          <h3 className="text-sm font-semibold">Aportes del hogar</h3>
          <ContributionManager householdProfile={householdProfile} onSaved={reload} />
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="space-y-3">
        <h3 className="text-sm font-semibold">
          {context === "personal" ? "Nueva transaccion personal" : "Nueva transaccion hogar"}
        </h3>
        {context === "personal" ? (
          <PersonalTransactionForm onSaved={reload} />
        ) : (
          <HouseholdTransactionForm onSaved={reload} />
        )}
      </SurfaceCard>

      <SurfaceCard className="space-y-3">
        <h3 className="text-sm font-semibold">
          {context === "personal" ? "Crear presupuesto personal" : "Crear presupuesto hogar"}
        </h3>
        {context === "personal" ? (
          <PersonalBudgetForm onSaved={reload} />
        ) : (
          <HouseholdBudgetForm onSaved={reload} />
        )}
      </SurfaceCard>

      <SurfaceCard className="space-y-3">
        <h3 className="text-sm font-semibold">
          {context === "personal" ? "Crear meta personal" : "Crear meta compartida"}
        </h3>
        {context === "personal" ? (
          <PersonalGoalForm onSaved={reload} />
        ) : (
          <SharedGoalForm onSaved={reload} />
        )}
      </SurfaceCard>

      {actionError ? (
        <SurfaceCard>
          <p className="text-xs text-destructive">{actionError}</p>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
