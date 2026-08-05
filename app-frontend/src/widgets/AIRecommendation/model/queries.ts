import { queryOptions } from "@tanstack/react-query";
import { aiService } from "@/services/recommendations/ai.service";

/** Puente Hook -> Service. Los componentes nunca llaman al API client. */
export const aiRecommendationsQuery = () =>
  queryOptions({
    queryKey: ["recommendations", "ai"],
    queryFn: () => aiService.list(),
    staleTime: 60_000
  });
