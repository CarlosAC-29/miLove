import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { createDemoStore } from "@/services/demo/demo-store";

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

const demoGifts = createDemoStore<GiftDto>([
  {
    id: "demo-gift-1",
    title: "Libro que quiere leer",
    description: "Una novela para disfrutar en vacaciones.",
    startAt: "2026-11-14T18:00:00.000Z",
    owner: { id: "usr-laura", name: "Laura Gómez" }
  }
]);

export const giftsService = {
  async listGifts(): Promise<GiftDto[]> {
    if (env.useMocks) return demoGifts.list();
    return apiClient.get<GiftDto[]>(API_ROUTES.gifts.list);
  },

  async createGift(input: UpsertGiftInput): Promise<GiftDto> {
    if (env.useMocks) {
      return demoGifts.create({
        ...input,
        owner: { id: "usr-carlos", name: "Carlos Rivera" }
      });
    }
    return apiClient.post<GiftDto>(API_ROUTES.gifts.list, input);
  },

  async updateGift(id: string, input: UpsertGiftInput): Promise<GiftDto> {
    if (env.useMocks) return demoGifts.update(id, input);
    return apiClient.put<GiftDto>(API_ROUTES.gifts.byId(id), input);
  },

  async deleteGift(id: string): Promise<void> {
    if (env.useMocks) {
      demoGifts.remove(id);
      return;
    }
    await apiClient.delete<void>(API_ROUTES.gifts.byId(id));
  }
};
