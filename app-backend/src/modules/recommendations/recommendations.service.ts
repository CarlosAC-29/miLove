import { HttpError } from "../../shared/errors/http-error.js";
import { env } from "../../config/env.js";
import { generateGeminiSuggestions } from "../../infrastructure/ai/gemini.client.js";
import { generateGroqSuggestions } from "../../infrastructure/ai/groq.client3.js";
import {
  recommendationsRepository,
  type DbRecommendationContext,
  type DbRecommendationSuggestion,
  type SuggestionCategory,
} from "./recommendations.repository.js";

interface RecommendationContextDto {
  id: string;
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

function mapContext(context: DbRecommendationContext): RecommendationContextDto {
  return {
    id: context.id,
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
  async getContext(userId: string) {
    const context = await recommendationsRepository.getContextByUser(userId);
    const stats = await recommendationsRepository.getSuggestionStats(userId);
    return {
      context: context ? mapContext(context) : null,
      suggestions: stats,
    };
  },

  async upsertContext(userId: string, context: string) {
    const saved = await recommendationsRepository.upsertContext(userId, context);
    return mapContext(saved);
  },

  async generateSuggestions(userId: string, input: { context?: string }) {
    let userContext = input.context;
    if (userContext) {
      userContext = userContext.trim();
      if (userContext.length === 0) {
        throw new HttpError(400, "Context is required.");
      }
      await recommendationsRepository.upsertContext(userId, userContext);
    }

    const context = await recommendationsRepository.getContextByUser(userId);
    if (!context) {
      throw new HttpError(400, "Context is required before generating suggestions.");
    }

    // Prefer Groq when configured; otherwise fall back to Gemini
    const suggestions = env.GROQ_API_KEY && env.GROQ_API_URL
      ? await generateGroqSuggestions(context.context)
      : await generateGeminiSuggestions(context.context);
    await recommendationsRepository.deleteSuggestionsByContext(context.id);
    const created = await recommendationsRepository.createSuggestions(context.id, userId, suggestions);

    return {
      context: mapContext(context),
      suggestions: created.map(mapSuggestion),
    };
  },

  async listSuggestions(userId: string, status: "all" | "accepted" | "pending") {
    const suggestions = await recommendationsRepository.listSuggestions(userId, status);
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
    const suggestions = await recommendationsRepository.listSuggestions(userId, "all");
    return suggestions.map((suggestion) => ({
      id: suggestion.id,
      title: suggestion.title,
      message: suggestion.message,
      createdAt: suggestion.createdAt.toISOString(),
    }));
  },
};
