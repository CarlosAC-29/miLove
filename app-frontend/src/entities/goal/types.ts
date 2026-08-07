import type { FinanceContext } from "@/entities/transaction/types";

export interface GoalDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  context: FinanceContext;
  deadline?: string;
  contributions?: GoalContributionDto[];
  isOwner?: boolean;
}

export interface GoalContributionDto {
  id: string;
  amount: number;
  month: string;
  isShared: boolean;
}

export interface Goal {
  readonly id: string;
  readonly name: string;
  readonly targetAmount: number;
  readonly currentAmount: number;
  readonly context: FinanceContext;
  readonly deadline?: string;
  readonly contributions: readonly GoalContribution[];
  readonly isOwner: boolean;
}

export interface GoalContribution {
  readonly id: string;
  readonly amount: number;
  readonly month: string;
  readonly isShared: boolean;
}

export function mapGoal(dto: GoalDto): Goal {
  return {
    ...dto,
    contributions: dto.contributions ?? [],
    isOwner: dto.isOwner ?? true
  };
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}
