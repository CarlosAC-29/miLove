import { HttpError } from "../../shared/errors/http-error.js";
import { env } from "../../config/env.js";
import { generateGeminiSuggestions } from "../../infrastructure/ai/gemini.client.js";
import { generateGroqSuggestions } from "../../infrastructure/ai/groq.client3.js";
import {
  recommendationsRepository,
  type DbRecommendationContext,
  type DbRecommendationSuggestion,
  type RecommendationModule,
  type SuggestionCategory,
} from "./recommendations.repository.js";

interface RecommendationContextDto {
  id: string;
  module: RecommendationModule;
  context: string;
  createdAt: string;
  updatedAt: string;
}

interface RecommendationSuggestionDto {
  id: string;
  contextId: string;
  category: SuggestionCategory;
  title: string;
  message: string;
  accepted: boolean;
  acceptedAt?: string;
  createdAt: string;
}

const recommendationModules: RecommendationModule[] = ["dates", "gifts", "movies", "restaurants"];

function mapContext(context: DbRecommendationContext): RecommendationContextDto {
  return {
    id: context.id,
    module: context.module,
    context: context.context,
    createdAt: context.createdAt.toISOString(),
    updatedAt: context.updatedAt.toISOString(),
  };
}

function mapSuggestion(suggestion: DbRecommendationSuggestion): RecommendationSuggestionDto {
  return {
    id: suggestion.id,
    contextId: suggestion.contextId,
    category: suggestion.category,
    title: suggestion.title,
    message: suggestion.message,
    accepted: suggestion.accepted,
    acceptedAt: suggestion.acceptedAt?.toISOString(),
    createdAt: suggestion.createdAt.toISOString(),
  };
}

export const recommendationsService = {
  async getContext(userId: string, module: RecommendationModule) {
    const context = await recommendationsRepository.getContextByUser(userId, module);
    const stats = await recommendationsRepository.getSuggestionStats(userId, module);
    return {
      context: context ? mapContext(context) : null,
      suggestions: stats,
    };
  },

  async upsertContext(userId: string, module: RecommendationModule, context: string) {
    const saved = await recommendationsRepository.upsertContext(userId, module, context);
    return mapContext(saved);
  },

  async generateSuggestions(
    userId: string,
    input: { context?: string; category?: SuggestionCategory; module: RecommendationModule },
  ) {
    let userContext = input.context;
    if (userContext) {
      userContext = userContext.trim();
      if (userContext.length === 0) {
        throw new HttpError(400, "Context is required.");
      }
      await recommendationsRepository.upsertContext(userId, input.module, userContext);
    }

    const context = await recommendationsRepository.getContextByUser(userId, input.module);
    if (!context) {
      throw new HttpError(400, "Context is required before generating suggestions.");
    }

    // Prefer Groq when configured; otherwise fall back to Gemini
    const suggestions = env.GROQ_API_KEY && env.GROQ_API_URL
      ? await generateGroqSuggestions(context.context)
      : await generateGeminiSuggestions(context.context);
    const forcedCategory = input.category;
    const normalizedSuggestions = forcedCategory
      ? suggestions.map((suggestion) => ({ ...suggestion, category: forcedCategory }))
      : suggestions;
    await recommendationsRepository.deleteSuggestionsByContext(context.id);
    const created = await recommendationsRepository.createSuggestions(context.id, userId, normalizedSuggestions);

    return {
      context: mapContext(context),
      suggestions: created.map(mapSuggestion),
    };
  },

  async listSuggestions(
    userId: string,
    status: "all" | "accepted" | "pending",
    module: RecommendationModule,
  ) {
    const suggestions = await recommendationsRepository.listSuggestions(userId, status, module);
    return suggestions.map(mapSuggestion);
  },

  async acceptSuggestions(userId: string, suggestionIds: string[]) {
    const accepted = await recommendationsRepository.acceptSuggestions(userId, suggestionIds);
    if (accepted.length === 0) {
      throw new HttpError(404, "No suggestions found for the provided ids.");
    }
    return accepted.map(mapSuggestion);
  },

  async deleteSuggestions(userId: string, suggestionIds: string[]) {
    const deletedCount = await recommendationsRepository.deleteSuggestions(userId, suggestionIds);
    if (deletedCount === 0) {
      throw new HttpError(404, "No suggestions found for the provided ids.");
    }
    return { deletedCount };
  },

  async listAiRecommendations(userId: string) {
    const suggestions = (
      await Promise.all(
        recommendationModules.map((module) =>
          recommendationsRepository.listSuggestions(userId, "all", module),
        ),
      )
    ).flat();
    return suggestions.map((suggestion) => ({
      id: suggestion.id,
      title: suggestion.title,
      message: suggestion.message,
      createdAt: suggestion.createdAt.toISOString(),
    }));
  },
};
