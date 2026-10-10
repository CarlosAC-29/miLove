import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CalendarPlus, Target, Trash2, Wallet } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { type UpdateBudgetInput } from "@/entities/budget/types";
import { type FinanceContext, type TransactionType } from "@/entities/transaction/types";
import { ContributionManager } from "@/features/finance/household/manageContributions/ContributionManager";
import { HouseholdTransactionForm } from "@/features/finance/household/addSharedExpense/HouseholdTransactionForm";
import { HouseholdBudgetForm } from "@/features/finance/household/createHouseholdBudget/HouseholdBudgetForm";
import { useEditSharedExpense } from "@/features/finance/household/editSharedExpense/useEditSharedExpense";
import { PersonalTransactionForm } from "@/features/finance/personal/addTransaction/PersonalTransactionForm";
import { PersonalBudgetForm } from "@/features/finance/personal/createBudget/PersonalBudgetForm";
import { PersonalGoalForm } from "@/features/finance/personal/createGoal/PersonalGoalForm";
import { useDeletePersonalTransaction } from "@/features/finance/personal/deleteTransaction/useDeletePersonalTransaction";
import { useEditPersonalTransaction } from "@/features/finance/personal/editTransaction/useEditPersonalTransaction";
import { useFinanceDashboard } from "@/features/finance/model/useFinanceDashboard";
import { financeService } from "@/services/finance/finance.service";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";
import { BalanceCard } from "@/widgets/BalanceCard/BalanceCard";
import { BudgetCard } from "@/widgets/BudgetCard/BudgetCard";
import { GoalProgress } from "@/widgets/GoalProgress/GoalProgress";
import { TransactionList } from "@/widgets/TransactionList/TransactionList";
import { SharedGoalForm } from "@/features/finance/household/createSharedGoal/SharedGoalForm";
import { FinancialAIAssistant } from "./FinancialAIAssistant";

export function FinanceDashboard({ context, month }: { context: FinanceContext; month: string }) {
  const {
    transactions,
    budgets,
    goals,
    householdProfile,
    summary,
    isLoading,
    error,
    refreshTransactionsAndBudgets,
    refreshBudgets,
    refreshGoals,
    refreshHouseholdProfile,
    retry
  } = useFinanceDashboard(context, month);
  const { deletePersonalTransaction } = useDeletePersonalTransaction(refreshTransactionsAndBudgets);
  const { editPersonalTransaction } = useEditPersonalTransaction(refreshTransactionsAndBudgets);
  const { editSharedExpense } = useEditSharedExpense(refreshTransactionsAndBudgets);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>("expense");
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isExtendingFixedTransactions, setIsExtendingFixedTransactions] = useState(false);
  const [isExtendConfirmationOpen, setIsExtendConfirmationOpen] = useState(false);
  const [isClearMonthConfirmationOpen, setIsClearMonthConfirmationOpen] = useState(false);
  const [isClearingMonth, setIsClearingMonth] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleDelete = async (transactionId: string) => {
    setActionError(null);
    setActionNotice(null);
    try {
      await deletePersonalTransaction(transactionId);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo eliminar la transaccion."
      );
    }
  };

  const handleEditTransaction = async (
    transactionId: string,
    changes: {
      amount: number;
      category: string;
      date: string;
      description: string;
    }
  ) => {
    setActionError(null);
    setActionNotice(null);
    try {
      if (context === "personal") {
        await editPersonalTransaction(transactionId, changes);
        return;
      }
      await editSharedExpense(transactionId, changes);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo editar la transaccion."
      );
      throw caughtError;
    }
  };

  const handleExtendFixedTransactions = async () => {
    setActionError(null);
    setActionNotice(null);
    setIsExtendingFixedTransactions(true);
    try {
      const created = await financeService.extendFixedTransactions(context, month);
      setActionNotice(
        created > 0
          ? `Se agregaron ${created} movimientos fijos para los próximos 3 meses.`
          : "Los movimientos fijos ya están programados para los próximos 3 meses."
      );
      setIsExtendConfirmationOpen(false);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron extender los movimientos fijos."
      );
    } finally {
      setIsExtendingFixedTransactions(false);
    }
  };

  const handleClearMonth = async () => {
    setActionError(null);
    setActionNotice(null);
    setIsClearingMonth(true);
    try {
      const deleted = await financeService.clearMonth(context, month);
      await refreshTransactionsAndBudgets();
      setActionNotice(
        `Se eliminaron ${deleted.transactions} movimientos y ${deleted.budgets} presupuestos de este mes.`
      );
      setIsClearMonthConfirmationOpen(false);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo limpiar el mes."
      );
    } finally {
      setIsClearingMonth(false);
    }
  };

  const handleEditBudget = async (budgetId: string, changes: UpdateBudgetInput) => {
    setActionError(null);
    setActionNotice(null);
    try {
      await financeService.updateBudget(budgetId, changes);
      await refreshBudgets();
      setActionNotice("Presupuesto actualizado.");
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo actualizar el presupuesto."
      );
      throw caughtError;
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    setActionError(null);
    setActionNotice(null);
    try {
      await financeService.deleteBudget(budgetId);
      await refreshBudgets();
      setActionNotice("Presupuesto eliminado.");
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "No se pudo eliminar el presupuesto."
      );
      throw caughtError;
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
        <Button type="button" variant="outline" onClick={() => void retry()}>
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
          <p className="text-xs text-muted-foreground">Periodo: {month}</p>
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="space-y-3">
        <h3 className="text-sm font-semibold">Acciones rápidas</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col gap-1 rounded-xl whitespace-normal"
                onClick={() => setTransactionModalType("expense")}
              >
                <ArrowDownCircle className="size-5" />
                <span className="text-center text-xs leading-tight">
                  {context === "personal" ? "Registrar gasto" : "Gasto hogar"}
                </span>
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col gap-1 rounded-xl whitespace-normal"
                onClick={() => setTransactionModalType("income")}
              >
                <ArrowUpCircle className="size-5" />
                <span className="text-center text-xs leading-tight">
                  {context === "personal" ? "Registrar ingreso" : "Ingreso hogar"}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {transactionModalType === "income"
                    ? context === "personal"
                      ? "Nuevo ingreso personal"
                      : "Nuevo ingreso hogar"
                    : context === "personal"
                      ? "Nuevo gasto personal"
                      : "Nuevo gasto hogar"}
                </DialogTitle>
              </DialogHeader>
              {context === "personal" ? (
                <PersonalTransactionForm
                  initialType={transactionModalType}
                  onSaved={async () => {
                    await refreshTransactionsAndBudgets();
                    setIsTransactionModalOpen(false);
                  }}
                />
              ) : (
                <HouseholdTransactionForm
                  initialType={transactionModalType}
                  onSaved={async () => {
                    await refreshTransactionsAndBudgets();
                    setIsTransactionModalOpen(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col gap-1 rounded-xl whitespace-normal"
              >
                <Wallet className="size-5" />
                <span className="text-center text-xs leading-tight">
                  {context === "personal" ? "Crear presupuesto" : "Presupuesto hogar"}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {context === "personal"
                    ? "Crear presupuesto personal"
                    : "Crear presupuesto hogar"}
                </DialogTitle>
              </DialogHeader>
              {context === "personal" ? (
                <PersonalBudgetForm
                  onSaved={async () => {
                    await refreshBudgets();
                    setIsBudgetModalOpen(false);
                  }}
                />
              ) : (
                <HouseholdBudgetForm
                  onSaved={async () => {
                    await refreshBudgets();
                    setIsBudgetModalOpen(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col gap-1 rounded-xl whitespace-normal"
              >
                <Target className="size-5" />
                <span className="text-center text-xs leading-tight">Crear meta</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {context === "personal" ? "Crear meta personal" : "Crear meta del hogar"}
                </DialogTitle>
              </DialogHeader>
              {context === "personal" ? (
                <PersonalGoalForm
                  onSaved={async () => {
                    await refreshGoals();
                    setIsGoalModalOpen(false);
                  }}
                />
              ) : (
                <SharedGoalForm
                  onSaved={async () => {
                    await refreshGoals();
                    setIsGoalModalOpen(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="outline"
            className="h-20 flex-col gap-1 rounded-xl whitespace-normal"
            onClick={() => setIsExtendConfirmationOpen(true)}
            disabled={
              isExtendingFixedTransactions ||
              !transactions.some(
                (transaction) =>
                  transaction.category === "gastos_fijos" ||
                  transaction.category === "ingresos_fijos"
              )
            }
          >
            <CalendarPlus className="size-5" />
            <span className="text-center text-xs leading-tight">Mantener fijos 3 meses</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="h-20 flex-col gap-1 rounded-xl whitespace-normal"
            onClick={() => setIsClearMonthConfirmationOpen(true)}
            disabled={isClearingMonth || (transactions.length === 0 && budgets.length === 0)}
          >
            <Trash2 className="size-5" />
            <span className="text-center text-xs leading-tight">Limpiar mes</span>
          </Button>
        </div>
      </SurfaceCard>

      <AlertDialog open={isExtendConfirmationOpen} onOpenChange={setIsExtendConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mantener movimientos fijos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se crearán copias de los ingresos y egresos fijos de este mes para los próximos tres
              meses. No se duplicarán los movimientos ya programados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExtendingFixedTransactions}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void handleExtendFixedTransactions()}
              disabled={isExtendingFixedTransactions}
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isClearMonthConfirmationOpen}
        onOpenChange={setIsClearMonthConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar este mes?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán permanentemente los gastos, ingresos y presupuestos de {month}. Las
              metas y los meses posteriores no se modificarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingMonth}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleClearMonth()}
              disabled={isClearingMonth}
            >
              Limpiar mes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BalanceCard summary={summary} transactions={transactions} />
      <GoalProgress goals={goals} month={month} onContributionSaved={refreshGoals} />
      <FinancialAIAssistant
        summary={summary}
        transactions={transactions}
        context={context}
        month={month}
      />
      <TransactionList
        transactions={transactions}
        type="expense"
        onDelete={context === "personal" ? handleDelete : undefined}
        onEdit={handleEditTransaction}
      />
      <TransactionList
        transactions={transactions}
        type="income"
        onDelete={context === "personal" ? handleDelete : undefined}
        onEdit={handleEditTransaction}
      />
      <BudgetCard budgets={budgets} onEdit={handleEditBudget} onDelete={handleDeleteBudget} />

      {context === "household" ? (
        <SurfaceCard className="space-y-3">
          <h3 className="text-sm font-semibold">Aportes del hogar</h3>
          <ContributionManager
            householdProfile={householdProfile}
            onSaved={refreshHouseholdProfile}
          />
        </SurfaceCard>
      ) : null}
      {actionError ? (
        <SurfaceCard>
          <p className="text-xs text-destructive">{actionError}</p>
        </SurfaceCard>
      ) : null}
      {actionNotice ? (
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">{actionNotice}</p>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
