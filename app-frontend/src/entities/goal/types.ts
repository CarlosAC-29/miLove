import type { FinanceContext } from "@/entities/transaction/types";

export interface GoalDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  context: FinanceContext;
  deadline?: string;
}

export interface Goal {
  readonly id: string;
  readonly name: string;
  readonly targetAmount: number;
  readonly currentAmount: number;
  readonly context: FinanceContext;
  readonly deadline?: string;
}

export function mapGoal(dto: GoalDto): Goal {
  return { ...dto };
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}
