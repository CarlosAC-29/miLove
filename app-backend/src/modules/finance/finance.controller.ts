import type { Request, Response } from "express";
import { financeService } from "./finance.service.js";
import {
  createBudgetSchema,
  createGoalSchema,
  createTransactionSchema,
  extendFixedTransactionsSchema,
  financeContextSchema,
  financeMonthSchema,
  updateContributionSchema,
  updateBudgetSchema,
  updateTransactionSchema,
} from "./finance.schemas.js";

export const financeController = {
  async listTransactions(request: Request, response: Response) {
    const context = financeContextSchema.parse(request.query.context);
    const month = financeMonthSchema.optional().parse(request.query.month);
    const data = await financeService.listTransactions(request.auth!.sub, context, month);
    return response.json(data);
  },

  async createTransaction(request: Request, response: Response) {
    const body = createTransactionSchema.parse(request.body);
    const data = await financeService.createTransaction(request.auth!.sub, body);
    return response.status(201).json(data);
  },

  async updateTransaction(request: Request, response: Response) {
    const body = updateTransactionSchema.parse(request.body);
    const data = await financeService.updateTransaction(request.auth!.sub, request.params.id, body);
    return response.json(data);
  },

  async extendFixedTransactions(request: Request, response: Response) {
    const body = extendFixedTransactionsSchema.parse(request.body);
    const created = await financeService.extendFixedTransactions(request.auth!.sub, body);
    return response.status(201).json({ created });
  },

  async deleteTransaction(request: Request, response: Response) {
    await financeService.deleteTransaction(request.auth!.sub, request.params.id);
    return response.status(204).send();
  },

  async listBudgets(request: Request, response: Response) {
    const context = financeContextSchema.parse(request.query.context);
    const month = financeMonthSchema.optional().parse(request.query.month);
    const data = await financeService.listBudgets(request.auth!.sub, context, month);
    return response.json(data);
  },

  async createBudget(request: Request, response: Response) {
    const body = createBudgetSchema.parse(request.body);
    const data = await financeService.createBudget(request.auth!.sub, body);
    return response.status(201).json(data);
  },

  async updateBudget(request: Request, response: Response) {
    const body = updateBudgetSchema.parse(request.body);
    const data = await financeService.updateBudget(request.auth!.sub, request.params.id, body);
    return response.json(data);
  },

  async deleteBudget(request: Request, response: Response) {
    await financeService.deleteBudget(request.auth!.sub, request.params.id);
    return response.status(204).send();
  },

  async listGoals(request: Request, response: Response) {
    const context = financeContextSchema.parse(request.query.context);
    const data = await financeService.listGoals(request.auth!.sub, context);
    return response.json(data);
  },

  async createGoal(request: Request, response: Response) {
    const body = createGoalSchema.parse(request.body);
    const data = await financeService.createGoal(request.auth!.sub, body);
    return response.status(201).json(data);
  },

  async summary(request: Request, response: Response) {
    const context = financeContextSchema.parse(request.query.context);
    const month = financeMonthSchema.optional().parse(request.query.month);
    const data = await financeService.getSummary(request.auth!.sub, context, month);
    return response.json(data);
  },

  async household(request: Request, response: Response) {
    const data = await financeService.getHouseholdProfile(request.auth!.sub);
    return response.json(data);
  },

  async updateContribution(request: Request, response: Response) {
    const body = updateContributionSchema.parse(request.body);
    const data = await financeService.updateContribution(request.auth!.sub, request.params.memberId, body.amount);
    return response.json(data);
  },

  async insights(request: Request, response: Response) {
    const context = financeContextSchema.parse(request.query.context ?? "personal");
    const month = financeMonthSchema.optional().parse(request.query.month);
    const data = await financeService.getInsights(request.auth!.sub, context, month);
    return response.json(data);
  },
};
