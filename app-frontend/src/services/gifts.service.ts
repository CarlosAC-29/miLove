import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

export interface GiftDto {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO
  endAt?: string | null;
  owner?: { id: string; name?: string } | null;
}

export interface UpsertGiftInput {
  title: string;
  description?: string;
  startAt: string;
}

export const giftsService = {
  async listGifts(): Promise<GiftDto[]> {
    return apiClient.get<GiftDto[]>(API_ROUTES.gifts.list);
  },

  async createGift(input: UpsertGiftInput): Promise<GiftDto> {
    return apiClient.post<GiftDto>(API_ROUTES.gifts.list, input);
  },

  async updateGift(id: string, input: UpsertGiftInput): Promise<GiftDto> {
    return apiClient.put<GiftDto>(API_ROUTES.gifts.byId(id), input);
  },

  async deleteGift(id: string): Promise<void> {
    await apiClient.delete<void>(API_ROUTES.gifts.byId(id));
  }
};
