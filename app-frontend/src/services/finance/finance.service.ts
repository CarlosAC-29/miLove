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
import { mapBudget, type Budget, type BudgetDto } from "@/entities/budget/types";
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

/**
 * Servicio financiero. Único punto de acceso a datos del módulo:
 * Componente -> Hook -> financeService -> (mock | API REST).
 */
export const financeService = {
  async listTransactions(context: FinanceContext): Promise<Transaction[]> {
    if (env.useMocks) {
      await delay();
      return memory.transactions
        .filter((t) => t.context === context)
        .sort(sortByDateDesc)
        .map(mapTransaction);
    }
    const dtos = await apiClient.get<TransactionDto[]>(API_ROUTES.finance.transactions, {
      query: { context }
    });
    return dtos.map(mapTransaction);
  },

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    if (env.useMocks) {
      await delay(300);
      const dto: TransactionDto = {
        ...input,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      memory.transactions = [dto, ...memory.transactions];
      applyBudgetSpend(dto, 1);
      return mapTransaction(dto);
    }
    const dto = await apiClient.post<TransactionDto>(API_ROUTES.finance.transactions, input);
    return mapTransaction(dto);
  },

  async updateTransaction(
    id: string,
    changes: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    if (env.useMocks) {
      await delay(300);
      const current = memory.transactions.find((t) => t.id === id);
      if (!current) throw new Error("La transacción no existe.");
      applyBudgetSpend(current, -1);
      const updated: TransactionDto = { ...current, ...changes };
      memory.transactions = memory.transactions.map((t) => (t.id === id ? updated : t));
      applyBudgetSpend(updated, 1);
      return mapTransaction(updated);
    }
    const dto = await apiClient.patch<TransactionDto>(
      `${API_ROUTES.finance.transactions}/${id}`,
      changes
    );
    return mapTransaction(dto);
  },

  async deleteTransaction(id: string): Promise<void> {
    if (env.useMocks) {
      await delay(250);
      const current = memory.transactions.find((t) => t.id === id);
      if (current) applyBudgetSpend(current, -1);
      memory.transactions = memory.transactions.filter((t) => t.id !== id);
      return;
    }
    await apiClient.delete(`${API_ROUTES.finance.transactions}/${id}`);
  },

  async listBudgets(context: FinanceContext): Promise<Budget[]> {
    if (env.useMocks) {
      await delay();
      return memory.budgets.filter((b) => b.context === context).map(mapBudget);
    }
    const dtos = await apiClient.get<BudgetDto[]>(API_ROUTES.finance.budgets, {
      query: { context }
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
    const dto = await apiClient.patch<HouseholdProfileDto>(
      `${API_ROUTES.finance.household}/contributions/${memberId}`,
      { amount }
    );
    return mapHouseholdProfile(dto);
  }
};

function applyBudgetSpend(transaction: TransactionDto, sign: 1 | -1): void {
  if (transaction.type !== "expense") return;
  memory.budgets = memory.budgets.map((budget) =>
    budget.context === transaction.context && budget.categoryId === transaction.category
      ? { ...budget, spent: Math.max(0, budget.spent + sign * transaction.amount) }
      : budget
  );
}
