import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { env } from "@/app/config/env";
import { delay } from "@/shared/lib/delay";
import {
  mapAiRecommendation,
  type AiRecommendation,
  type AiRecommendationDto,
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
};
