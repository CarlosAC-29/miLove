import type { FinanceContext } from "@/entities/transaction/types";

export interface BudgetDto {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  spent: number;
  context: FinanceContext;
}

export interface Budget {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly amount: number;
  readonly spent: number;
  readonly context: FinanceContext;
}

export function mapBudget(dto: BudgetDto): Budget {
  return { ...dto };
}

export function budgetProgress(budget: Budget): number {
  if (budget.amount <= 0) return 0;
  return Math.min(100, Math.round((budget.spent / budget.amount) * 100));
}
