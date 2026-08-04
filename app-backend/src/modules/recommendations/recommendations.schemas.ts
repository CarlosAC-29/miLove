import { z } from "zod";

export const upsertContextSchema = z.object({
  context: z.string().min(10).max(2000),
});

export const generateSuggestionsSchema = z.object({
  context: z.string().min(10).max(2000).optional(),
});

export const listSuggestionsQuerySchema = z
  .enum(["all", "accepted", "pending"])
  .default("all");

export const acceptSuggestionsSchema = z.object({
  suggestionIds: z.array(z.string().uuid()).min(1),
});
