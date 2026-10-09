import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { createDemoStore } from "@/services/demo/demo-store";

export interface WishlistItemDto {
  id: string;
  title: string;
  description?: string | null;
  webUrl?: string | null;
  startAt: string;
  owner?: { id: string; name?: string } | null;
}

export interface UpsertWishlistItemInput {
  title: string;
  description?: string;
  webUrl?: string;
}

const demoWishlist = createDemoStore<WishlistItemDto>([
  {
    id: "demo-wishlist-1",
    title: "Juego de tazas",
    description: "Para las mañanas de café juntos.",
    webUrl: "https://example.com/tazas",
    startAt: "2026-10-08T12:00:00.000Z",
    owner: { id: "usr-carlos", name: "Carlos Rivera" }
  }
]);

export const wishlistService = {
  async listItems(): Promise<WishlistItemDto[]> {
    if (env.useMocks) return demoWishlist.list();
    return apiClient.get<WishlistItemDto[]>(API_ROUTES.wishlist.list);
  },

  async createItem(input: UpsertWishlistItemInput): Promise<WishlistItemDto> {
    if (env.useMocks) {
      return demoWishlist.create({
        ...input,
        startAt: new Date().toISOString(),
        owner: { id: "usr-carlos", name: "Carlos Rivera" }
      });
    }
    return apiClient.post<WishlistItemDto>(API_ROUTES.wishlist.list, input);
  },

  async updateItem(id: string, input: UpsertWishlistItemInput): Promise<WishlistItemDto> {
    if (env.useMocks) return demoWishlist.update(id, input);
    return apiClient.put<WishlistItemDto>(API_ROUTES.wishlist.byId(id), input);
  },

  async deleteItem(id: string): Promise<void> {
    if (env.useMocks) {
      demoWishlist.remove(id);
      return;
    }
    await apiClient.delete<void>(API_ROUTES.wishlist.byId(id));
  }
};
