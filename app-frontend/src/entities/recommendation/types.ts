/** DTO tal como lo devolverá el backend REST. */
export interface AiRecommendationDto {
  id: string;
  title: string;
  message: string;
  module?: string;
  createdAt: string;
}

/** Modelo de dominio consumido por la UI. */
export interface AiRecommendation {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly module?: string;
  readonly createdAt: string;
}

export function mapAiRecommendation(dto: AiRecommendationDto): AiRecommendation {
  return { ...dto };
}

export type SuggestionCategory = "date" | "restaurant" | "activity" | "gift" | "trip";
export type SuggestionStatus = "all" | "accepted" | "pending";
export type RecommendationModule = "dates" | "gifts" | "movies" | "restaurants";

export interface RecommendationContextDto {
  id: string;
  module: RecommendationModule;
  context: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationSuggestionDto {
  id: string;
  contextId: string;
  category: SuggestionCategory;
  title: string;
  message: string;
  accepted: boolean;
  acceptedAt?: string;
  createdAt: string;
}

export interface RecommendationContextStateDto {
  context: RecommendationContextDto | null;
  suggestions: {
    total: number;
    accepted: number;
    pending: number;
  };
}

export interface UpsertRecommendationContextInput {
  module: RecommendationModule;
  context: string;
}

export interface GenerateSuggestionsInput {
  module: RecommendationModule;
  context?: string;
  category?: SuggestionCategory;
}

export interface AcceptSuggestionsInput {
  suggestionIds: string[];
}
