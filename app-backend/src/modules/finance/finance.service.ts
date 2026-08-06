import { HttpError } from "../../shared/errors/http-error.js";
import { financeRepository, type FinanceContext } from "./finance.repository.js";

function buildSummary(
  transactions: Array<{ amount: number; type: "income" | "expense"; category: string; isFixed: boolean }>,
) {
  const income = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const fixedExpenses = transactions
    .filter((t) => t.type === "expense" && t.isFixed && t.category !== "ahorro")
    .reduce((acc, t) => acc + t.amount, 0);
  const variableExpenses = transactions
    .filter((t) => t.type === "expense" && !t.isFixed && t.category !== "ahorro")
    .reduce((acc, t) => acc + t.amount, 0);
  const savings = transactions
    .filter((t) => t.type === "expense" && t.category === "ahorro")
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = fixedExpenses + variableExpenses;
  const balance = income - expenses - savings;
  return {
    income,
    expenses,
    fixedExpenses,
    savings,
    balance,
  };
}

export const financeService = {
  listTransactions(userId: string, context: FinanceContext, month?: string) {
    return financeRepository.listTransactions(userId, context, month);
  },

  createTransaction(
    userId: string,
    input: {
      amount: number;
      type: "income" | "expense";
      category: string;
      isFixed?: boolean;
      description: string;
      date: string;
      context: FinanceContext;
      ownerId: string;
    },
  ) {
    return financeRepository.createTransaction({ userId, ...input });
  },

  extendFixedTransactions(
    userId: string,
    input: { context: FinanceContext; month: string },
  ) {
    return financeRepository.extendFixedTransactions(userId, input.context, input.month);
  },

  async updateTransaction(userId: string, id: string, patch: Record<string, unknown>) {
    const updated = await financeRepository.updateTransaction(userId, id, patch);
    if (!updated) throw new HttpError(404, "Transaction not found.");
    return updated;
  },

  deleteTransaction(userId: string, id: string) {
    return financeRepository.deleteTransaction(userId, id);
  },

  listBudgets(userId: string, context: FinanceContext, month?: string) {
    return financeRepository.listBudgets(userId, context, month);
  },

  createBudget(
    userId: string,
    input: {
      name: string;
      categoryId: string;
      amount: number;
      month: string;
      context: FinanceContext;
    },
  ) {
    return financeRepository.createBudget({ userId, ...input });
  },

  async updateBudget(userId: string, id: string, patch: Record<string, unknown>) {
    const updated = await financeRepository.updateBudget(userId, id, patch);
    if (!updated) throw new HttpError(404, "Budget not found.");
    return updated;
  },

  async deleteBudget(userId: string, id: string) {
    const deleted = await financeRepository.deleteBudget(userId, id);
    if (!deleted) throw new HttpError(404, "Budget not found.");
  },

  listGoals(userId: string, context: FinanceContext) {
    return financeRepository.listGoals(userId, context);
  },

  createGoal(
    userId: string,
    input: {
      name: string;
      targetAmount: number;
      currentAmount: number;
      context: FinanceContext;
      deadline?: string;
    },
  ) {
    return financeRepository.createGoal({ userId, ...input });
  },

  async getSummary(userId: string, context: FinanceContext, month?: string) {
    const transactions = await financeRepository.listTransactions(userId, context, month);
    return buildSummary(transactions);
  },

  async getHouseholdProfile(userId: string) {
    const members = await financeRepository.listHouseholdMembers(userId);
    if (members.length === 0) {
      return {
        id: "household-empty",
        name: "Finanzas del Hogar",
        members: [],
      };
    }
    return {
      id: members[0]!.householdId,
      name: members[0]!.householdName,
      members: members.map((member) => ({
        memberId: member.memberId,
        userId: member.userId,
        memberName: member.memberName,
        amount: member.amount,
      })),
    };
  },

  async updateContribution(userId: string, memberId: string, amount: number) {
    const members = await financeRepository.listHouseholdMembers(userId);
    const exists = members.some((member) => member.memberId === memberId);
    if (!exists) throw new HttpError(404, "Member not found in your household.");

    await financeRepository.updateContribution(memberId, amount);
    return this.getHouseholdProfile(userId);
  },

  async getInsights(userId: string, context: FinanceContext, month?: string) {
    const summary = await this.getSummary(userId, context, month);
    const potential = Math.round(summary.expenses * 0.1);
    const monthLabel = month ?? new Date().toISOString().slice(0, 7);
    return [
      {
        title: "Financial AI Assistant",
        message: `En ${monthLabel} llevas ${summary.expenses.toLocaleString("es-CO")} en gastos. Podrías ahorrar aproximadamente ${potential.toLocaleString("es-CO")} si recortas gastos pequeños.`,
      },
    ];
  },
};
