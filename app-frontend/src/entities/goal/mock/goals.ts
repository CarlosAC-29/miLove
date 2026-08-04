import type { GoalDto } from "../types";

export const MOCK_GOALS: GoalDto[] = [
  {
    id: "goal-1",
    name: "Comprar computador",
    targetAmount: 4_000_000,
    currentAmount: 2_500_000,
    context: "personal",
    deadline: "2026-12-01",
  },
  {
    id: "goal-2",
    name: "Fondo de emergencia",
    targetAmount: 6_000_000,
    currentAmount: 1_800_000,
    context: "personal",
  },
  {
    id: "goal-3",
    name: "Viaje a Europa",
    targetAmount: 10_000_000,
    currentAmount: 3_500_000,
    context: "household",
    deadline: "2027-06-01",
  },
  {
    id: "goal-4",
    name: "Remodelar la cocina",
    targetAmount: 5_000_000,
    currentAmount: 1_200_000,
    context: "household",
  },
];
