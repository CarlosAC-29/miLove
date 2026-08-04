import type { BudgetDto } from "../types";

export const MOCK_HOUSEHOLD_BUDGETS: BudgetDto[] = [
  {
    id: "hbg-1",
    name: "Mercado",
    categoryId: "alimentacion",
    amount: 900_000,
    spent: 600_000,
    context: "household",
  },
  {
    id: "hbg-2",
    name: "Servicios",
    categoryId: "hogar",
    amount: 400_000,
    spent: 250_000,
    context: "household",
  },
  {
    id: "hbg-3",
    name: "Planes en pareja",
    categoryId: "entretenimiento",
    amount: 500_000,
    spent: 180_000,
    context: "household",
  },
];
