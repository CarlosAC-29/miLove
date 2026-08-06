import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

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

export const restaurantsService = {
  async listRestaurants(): Promise<RestaurantDto[]> {
    return apiClient.get<RestaurantDto[]>(API_ROUTES.restaurants.list);
  },

  async createRestaurant(input: UpsertRestaurantInput): Promise<RestaurantDto> {
    return apiClient.post<RestaurantDto>(API_ROUTES.restaurants.list, input);
  },

  async updateRestaurant(id: string, input: UpsertRestaurantInput): Promise<RestaurantDto> {
    return apiClient.put<RestaurantDto>(API_ROUTES.restaurants.byId(id), input);
  },

  async deleteRestaurant(id: string): Promise<void> {
    await apiClient.delete<void>(API_ROUTES.restaurants.byId(id));
  }
};
