import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { createDemoStore } from "@/services/demo/demo-store";

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

const demoGoals = createDemoStore<GoalDto>([
  {
    id: "demo-goal-1",
    title: "Escapada de fin de semana",
    description: "Elegir destino y reservar alojamiento.",
    startAt: "2026-11-07T09:00:00.000Z",
    owner: { id: "usr-laura", name: "Laura Gómez" }
  }
]);

export const goalsService = {
  async listGoals(): Promise<GoalDto[]> {
    if (env.useMocks) return demoGoals.list();
    return apiClient.get<GoalDto[]>(API_ROUTES.goals.list);
  },

  async createGoal(input: UpsertGoalInput): Promise<GoalDto> {
    if (env.useMocks) {
      return demoGoals.create({
        ...input,
        startAt: new Date().toISOString(),
        owner: { id: "usr-carlos", name: "Carlos Rivera" }
      });
    }
    return apiClient.post<GoalDto>(API_ROUTES.goals.list, input);
  },

  async updateGoal(id: string, input: UpsertGoalInput): Promise<GoalDto> {
    if (env.useMocks) return demoGoals.update(id, input);
    return apiClient.put<GoalDto>(API_ROUTES.goals.byId(id), input);
  },

  async deleteGoal(id: string): Promise<void> {
    if (env.useMocks) {
      demoGoals.remove(id);
      return;
    }
    await apiClient.delete<void>(API_ROUTES.goals.byId(id));
  }
};
