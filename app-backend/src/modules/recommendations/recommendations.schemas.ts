import { z } from "zod";

export const recommendationModuleSchema = z.enum(["dates", "gifts", "movies", "restaurants"]);

export const upsertContextSchema = z.object({
  context: z.string().min(10).max(2000),
  module: recommendationModuleSchema,
});

export const generateSuggestionsSchema = z.object({
  context: z.string().min(10).max(2000).optional(),
  category: z.enum(["date", "restaurant", "activity", "gift", "trip"]).optional(),
  module: recommendationModuleSchema,
});

export const listSuggestionsQuerySchema = z.object({
  status: z.enum(["all", "accepted", "pending"]).default("all"),
  module: recommendationModuleSchema,
});

export const acceptSuggestionsSchema = z.object({
  suggestionIds: z.array(z.string().uuid()).min(1),
});

export const deleteSuggestionsSchema = z.object({
  suggestionIds: z.array(z.string().uuid()).min(1),
});
