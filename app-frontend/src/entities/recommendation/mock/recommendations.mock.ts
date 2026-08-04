import type { AiRecommendationDto } from "../types";

export const MOCK_RECOMMENDATIONS: AiRecommendationDto[] = [
  {
    id: "rec-1",
    title: "Plan del fin de semana",
    message:
      "Este fin de semana podrían hacer una cena italiana en casa: tienen un presupuesto disponible de $120.000 y no han usado la categoría Restaurantes este mes.",
    module: "dates",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rec-2",
    title: "Ahorro en pareja",
    message:
      "Van 18% por encima del presupuesto de Entretenimiento. Cambiar una salida por una noche de cine en casa les ahorraría cerca de $85.000.",
    module: "finance",
    createdAt: new Date().toISOString(),
  },
];
