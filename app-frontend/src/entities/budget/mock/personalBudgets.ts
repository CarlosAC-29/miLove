import type { BudgetDto } from "../types";

export const MOCK_PERSONAL_BUDGETS: BudgetDto[] = [
  {
    id: "pbg-1",
    name: "Entretenimiento",
    categoryId: "entretenimiento",
    amount: 300_000,
    spent: 150_000,
    month: "2026-08",
    context: "personal"
  },
  {
    id: "pbg-2",
    name: "Alimentación",
    categoryId: "alimentacion",
    amount: 600_000,
    spent: 350_000,
    month: "2026-08",
    context: "personal"
  },
  {
    id: "pbg-3",
    name: "Transporte",
    categoryId: "transporte",
    amount: 250_000,
    spent: 220_000,
    month: "2026-07",
    context: "personal"
  }
];
