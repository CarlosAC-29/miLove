import { env } from "@/app/config/env";
import { delay } from "@/shared/lib/delay";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import {
  mapTransaction,
  type CreateTransactionInput,
  type FinanceContext,
  type Transaction,
  type TransactionDto
} from "@/entities/transaction/types";
import { MOCK_PERSONAL_TRANSACTIONS } from "@/entities/transaction/mock/personalTransactions";
import { MOCK_HOUSEHOLD_TRANSACTIONS } from "@/entities/transaction/mock/householdTransactions";
import { mapBudget, type Budget, type BudgetDto, type UpdateBudgetInput } from "@/entities/budget/types";
import { MOCK_PERSONAL_BUDGETS } from "@/entities/budget/mock/personalBudgets";
import { MOCK_HOUSEHOLD_BUDGETS } from "@/entities/budget/mock/householdBudgets";
import { mapGoal, type Goal, type GoalDto } from "@/entities/goal/types";
import { MOCK_GOALS } from "@/entities/goal/mock/goals";
import {
  mapHouseholdProfile,
  type HouseholdProfile,
  type HouseholdProfileDto
} from "@/entities/finance-profile/types";
import { MOCK_HOUSEHOLD_PROFILE } from "@/entities/finance-profile/mock/householdProfile.mock";

/**
 * Estado en memoria del modo mock. Simula la base de datos del backend para
 * que las mutaciones se reflejen en la UI sin acoplar componentes a los mocks.
 */
const memory = {
  transactions: [...MOCK_PERSONAL_TRANSACTIONS, ...MOCK_HOUSEHOLD_TRANSACTIONS] as TransactionDto[],
  budgets: [...MOCK_PERSONAL_BUDGETS, ...MOCK_HOUSEHOLD_BUDGETS] as BudgetDto[],
  goals: [...MOCK_GOALS] as GoalDto[],
  household: MOCK_HOUSEHOLD_PROFILE as HouseholdProfileDto
};

function sortByDateDesc(a: TransactionDto, b: TransactionDto): number {
  return b.date.localeCompare(a.date);
}

function normalizeMonth(date: string): string {
  return date.slice(0, 7);
}

function appliesToMonth(transaction: TransactionDto, month: string): boolean {
  return normalizeMonth(transaction.date) === month;
}

/**
 * Servicio financiero. Único punto de acceso a datos del módulo:
 * Componente -> Hook -> financeService -> (mock | API REST).
 */
export const financeService = {
  async listTransactions(context: FinanceContext, month: string): Promise<Transaction[]> {
    if (env.useMocks) {
      await delay();
      return memory.transactions
        .filter((t) => t.context === context && appliesToMonth(t, month))
        .sort(sortByDateDesc)
        .map(mapTransaction);
    }
    const dtos = await apiClient.get<TransactionDto[]>(API_ROUTES.finance.transactions, {
      query: { context, month }
    });
    return dtos.map(mapTransaction);
  },

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    if (env.useMocks) {
      await delay(300);
      const dto: TransactionDto = {
        ...input,
        isFixed: input.isFixed ?? false,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      memory.transactions = [dto, ...memory.transactions];
      return mapTransaction(dto);
    }
    const dto = await apiClient.post<TransactionDto>(API_ROUTES.finance.transactions, input);
    return mapTransaction(dto);
  },

  async extendFixedTransactions(context: FinanceContext, month: string): Promise<number> {
    if (env.useMocks) {
      await delay(300);
      const fixedTransactions = memory.transactions.filter(
        (transaction) =>
          transaction.context === context &&
          transaction.isFixed &&
          normalizeMonth(transaction.date) === month
      );
      const copies = fixedTransactions.flatMap((transaction) =>
        [1, 2, 3]
          .map((offset) => {
            const date = new Date(`${month}-01T00:00:00Z`);
            date.setUTCMonth(date.getUTCMonth() + offset);
            const lastDay = new Date(
              Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
            ).getUTCDate();
            const day = Math.min(Number(transaction.date.slice(8, 10)), lastDay);
            const nextDate = new Date(
              Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), day)
            )
              .toISOString()
              .slice(0, 10);
            return {
              ...transaction,
              id: `${transaction.id}-${nextDate}`,
              date: nextDate,
              createdAt: new Date().toISOString()
            };
          })
          .filter(
            (copy) =>
              !memory.transactions.some(
                (transaction) =>
                  transaction.id === copy.id ||
                  (transaction.description === copy.description &&
                    transaction.context === copy.context &&
                    transaction.type === copy.type &&
                    transaction.isFixed &&
                    transaction.date === copy.date)
              )
          )
      );
      memory.transactions = [...copies, ...memory.transactions];
      return copies.length;
    }
    const response = await apiClient.post<{ created: number }>(
      API_ROUTES.finance.extendFixedTransactions,
      { context, month }
    );
    return response.created;
  },

  async updateTransaction(
    id: string,
    changes: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    if (env.useMocks) {
      await delay(300);
      const current = memory.transactions.find((t) => t.id === id);
      if (!current) throw new Error("La transacción no existe.");
      const updated: TransactionDto = { ...current, ...changes };
      memory.transactions = memory.transactions.map((t) => (t.id === id ? updated : t));
      return mapTransaction(updated);
    }
    const dto = await apiClient.put<TransactionDto>(
      `${API_ROUTES.finance.transactions}/${id}`,
      changes
    );
    return mapTransaction(dto);
  },

  async deleteTransaction(id: string): Promise<void> {
    if (env.useMocks) {
      await delay(250);
      memory.transactions = memory.transactions.filter((t) => t.id !== id);
      return;
    }
    await apiClient.delete(`${API_ROUTES.finance.transactions}/${id}`);
  },

  async listBudgets(context: FinanceContext, month: string): Promise<Budget[]> {
    if (env.useMocks) {
      await delay();
      const monthlyExpenses = memory.transactions
        .filter(
          (transaction) =>
            transaction.context === context &&
            transaction.type === "expense" &&
            appliesToMonth(transaction, month)
        )
        .reduce<Record<string, number>>((acc, transaction) => {
          acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
          return acc;
        }, {});

      return memory.budgets
        .filter((budget) => budget.context === context && budget.month === month)
        .map((budget) =>
          mapBudget({
            ...budget,
            spent: monthlyExpenses[budget.categoryId] ?? 0
          })
        );
    }
    const dtos = await apiClient.get<BudgetDto[]>(API_ROUTES.finance.budgets, {
      query: { context, month }
    });
    return dtos.map(mapBudget);
  },

  async createBudget(input: Omit<BudgetDto, "id" | "spent">): Promise<Budget> {
    if (env.useMocks) {
      await delay(300);
      const dto: BudgetDto = { ...input, id: `bg-${Date.now()}`, spent: 0 };
      memory.budgets = [...memory.budgets, dto];
      return mapBudget(dto);
    }
    const dto = await apiClient.post<BudgetDto>(API_ROUTES.finance.budgets, input);
    return mapBudget(dto);
  },

  async updateBudget(id: string, changes: UpdateBudgetInput): Promise<Budget> {
    if (env.useMocks) {
      await delay(300);
      const current = memory.budgets.find((budget) => budget.id === id);
      if (!current) throw new Error("El presupuesto no existe.");
      const updated: BudgetDto = { ...current, ...changes };
      memory.budgets = memory.budgets.map((budget) => (budget.id === id ? updated : budget));
      return mapBudget(updated);
    }
    const dto = await apiClient.put<BudgetDto>(API_ROUTES.finance.budgetById(id), changes);
    return mapBudget(dto);
  },

  async deleteBudget(id: string): Promise<void> {
    if (env.useMocks) {
      await delay(250);
      memory.budgets = memory.budgets.filter((budget) => budget.id !== id);
      return;
    }
    await apiClient.delete(API_ROUTES.finance.budgetById(id));
  },

  async listGoals(context: FinanceContext): Promise<Goal[]> {
    if (env.useMocks) {
      await delay();
      return memory.goals.filter((g) => g.context === context).map(mapGoal);
    }
    const dtos = await apiClient.get<GoalDto[]>(API_ROUTES.finance.goals, { query: { context } });
    return dtos.map(mapGoal);
  },

  async createGoal(input: Omit<GoalDto, "id">): Promise<Goal> {
    if (env.useMocks) {
      await delay(300);
      const dto: GoalDto = { ...input, id: `goal-${Date.now()}` };
      memory.goals = [...memory.goals, dto];
      return mapGoal(dto);
    }
    const dto = await apiClient.post<GoalDto>(API_ROUTES.finance.goals, input);
    return mapGoal(dto);
  },

  async getHouseholdProfile(): Promise<HouseholdProfile> {
    if (env.useMocks) {
      await delay();
      return mapHouseholdProfile(memory.household);
    }
    const dto = await apiClient.get<HouseholdProfileDto>(API_ROUTES.finance.household);
    return mapHouseholdProfile(dto);
  },

  async updateContribution(memberId: string, amount: number): Promise<HouseholdProfile> {
    if (env.useMocks) {
      await delay(250);
      memory.household = {
        ...memory.household,
        members: memory.household.members.map((m) =>
          m.memberId === memberId ? { ...m, amount } : m
        )
      };
      return mapHouseholdProfile(memory.household);
    }
    const dto = await apiClient.put<HouseholdProfileDto>(
      `${API_ROUTES.finance.household}/contributions/${memberId}`,
      { amount }
    );
    return mapHouseholdProfile(dto);
  }
};
