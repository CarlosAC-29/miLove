import { z } from "zod";

export const financeContextSchema = z.enum(["personal", "household"]);

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  context: financeContextSchema,
  ownerId: z.string().min(1),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const createBudgetSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  context: financeContextSchema,
});

export const createGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  context: financeContextSchema,
  deadline: z.string().optional(),
});

export const updateContributionSchema = z.object({
  amount: z.number().nonnegative(),
});
