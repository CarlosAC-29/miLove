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
    return apiClient.get<PlanDto[]>(API_ROUTES.plans.list);
  }
};
