import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { createDemoStore } from "@/services/demo/demo-store";

export interface RestaurantDto {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO
  endAt?: string | null;
  owner?: { id: string; name?: string } | null;
}

export interface UpsertRestaurantInput {
  title: string;
  description?: string;
  startAt: string;
}

const demoRestaurants = createDemoStore<RestaurantDto>([
  {
    id: "demo-restaurant-1",
    title: "Cena italiana",
    description: "Restaurante recomendado para celebrar el aniversario.",
    startAt: "2026-10-24T20:00:00.000Z",
    owner: { id: "usr-laura", name: "Laura Gómez" }
  }
]);

export const restaurantsService = {
  async listRestaurants(): Promise<RestaurantDto[]> {
    if (env.useMocks) return demoRestaurants.list();
    return apiClient.get<RestaurantDto[]>(API_ROUTES.restaurants.list);
  },

  async createRestaurant(input: UpsertRestaurantInput): Promise<RestaurantDto> {
    if (env.useMocks) {
      return demoRestaurants.create({
        ...input,
        owner: { id: "usr-carlos", name: "Carlos Rivera" }
      });
    }
    return apiClient.post<RestaurantDto>(API_ROUTES.restaurants.list, input);
  },

  async updateRestaurant(id: string, input: UpsertRestaurantInput): Promise<RestaurantDto> {
    if (env.useMocks) return demoRestaurants.update(id, input);
    return apiClient.put<RestaurantDto>(API_ROUTES.restaurants.byId(id), input);
  },

  async deleteRestaurant(id: string): Promise<void> {
    if (env.useMocks) {
      demoRestaurants.remove(id);
      return;
    }
    await apiClient.delete<void>(API_ROUTES.restaurants.byId(id));
  }
};
