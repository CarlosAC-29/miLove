import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

export interface GoalDto {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  owner?: { id: string; name?: string } | null;
}

export interface UpsertGoalInput {
  title: string;
  description?: string;
}

export const goalsService = {
  async listGoals(): Promise<GoalDto[]> {
    return apiClient.get<GoalDto[]>(API_ROUTES.goals.list);
  },

  async createGoal(input: UpsertGoalInput): Promise<GoalDto> {
    return apiClient.post<GoalDto>(API_ROUTES.goals.list, input);
  },

  async updateGoal(id: string, input: UpsertGoalInput): Promise<GoalDto> {
    return apiClient.put<GoalDto>(API_ROUTES.goals.byId(id), input);
  },

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete<void>(API_ROUTES.goals.byId(id));
  }
};
