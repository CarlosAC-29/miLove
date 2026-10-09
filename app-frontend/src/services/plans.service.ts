import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

export interface PlanDto {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  startAt: string;
  owner?: { id: string; name?: string } | null;
}

export const plansService = {
  async listPlans(): Promise<PlanDto[]> {
    if (env.useMocks) {
      return [
        {
          id: "demo-plan-1",
          category: "viaje",
          title: "Visitar un pueblo cercano",
          description: "Planear una escapada para desconectarnos.",
          startAt: "2026-11-01T09:00:00.000Z",
          owner: { id: "usr-laura", name: "Laura Gómez" }
        }
      ];
    }
    return apiClient.get<PlanDto[]>(API_ROUTES.plans.list);
  }
};
