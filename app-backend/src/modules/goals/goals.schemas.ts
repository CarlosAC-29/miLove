import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(160);
const descriptionSchema = z.string().trim().max(2000).optional().default("");

export const goalIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createGoalSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
});

export const updateGoalSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
});
