import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { env } from "@/app/config/env";
import { delay } from "@/shared/lib/delay";
import {
  type AcceptSuggestionsInput,
  mapAiRecommendation,
  type AiRecommendation,
  type AiRecommendationDto,
  type GenerateSuggestionsInput,
  type RecommendationContextDto,
  type RecommendationContextStateDto,
  type RecommendationSuggestionDto,
  type SuggestionStatus,
  type UpsertRecommendationContextInput,
} from "@/entities/recommendation/types";
import { MOCK_RECOMMENDATIONS } from "@/entities/recommendation/mock/recommendations.mock";

/**
 * Servicio de recomendaciones. Hoy resuelve con mocks; al activar el backend
 * (`VITE_USE_MOCKS=false`) usa el API client sin que la UI cambie.
 */
export const aiService = {
  async list(): Promise<AiRecommendation[]> {
    if (env.useMocks) {
      await delay();
      return MOCK_RECOMMENDATIONS.map(mapAiRecommendation);
    }
    const dtos = await apiClient.get<AiRecommendationDto[]>(API_ROUTES.recommendations.ai);
    return dtos.map(mapAiRecommendation);
  },

  async getContextState(): Promise<RecommendationContextStateDto> {
    if (env.useMocks) {
      await delay(200);
      return {
        context: null,
        suggestions: { total: 0, accepted: 0, pending: 0 },
      };
    }
    return apiClient.get<RecommendationContextStateDto>(API_ROUTES.recommendations.context);
  },

  async upsertContext(input: UpsertRecommendationContextInput): Promise<RecommendationContextDto> {
    if (env.useMocks) {
      await delay(300);
      return {
        id: "ctx-mock",
        context: input.context,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return apiClient.put<RecommendationContextDto>(API_ROUTES.recommendations.context, input);
  },

  async generateSuggestions(input: GenerateSuggestionsInput = {}): Promise<{
    context: RecommendationContextDto;
    suggestions: RecommendationSuggestionDto[];
  }> {
    if (env.useMocks) {
      await delay(400);
      return {
        context: {
          id: "ctx-mock",
          context: input.context ?? "Contexto de ejemplo para citas",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        suggestions: [],
      };
    }
    return apiClient.post<{ context: RecommendationContextDto; suggestions: RecommendationSuggestionDto[] }>(
      API_ROUTES.recommendations.generate,
      input,
    );
  },

  async listSuggestions(status: SuggestionStatus = "all"): Promise<RecommendationSuggestionDto[]> {
    if (env.useMocks) {
      await delay(200);
      return [];
    }
    return apiClient.get<RecommendationSuggestionDto[]>(API_ROUTES.recommendations.suggestions, {
      query: { status },
    });
  },

  async acceptSuggestions(input: AcceptSuggestionsInput): Promise<RecommendationSuggestionDto[]> {
    if (env.useMocks) {
      await delay(200);
      return [];
    }
    return apiClient.post<RecommendationSuggestionDto[]>(API_ROUTES.recommendations.accept, input);
  },
};
