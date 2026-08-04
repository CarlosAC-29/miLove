/** DTO tal como lo devolverá el backend REST. */
export interface AiRecommendationDto {
  id: string;
  title: string;
  message: string;
  module: string;
  createdAt: string;
}

/** Modelo de dominio consumido por la UI. */
export interface AiRecommendation {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly module: string;
  readonly createdAt: string;
}

export function mapAiRecommendation(dto: AiRecommendationDto): AiRecommendation {
  return { ...dto };
}
