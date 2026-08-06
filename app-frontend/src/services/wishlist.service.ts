import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

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

export const wishlistService = {
  async listItems(): Promise<WishlistItemDto[]> {
    return apiClient.get<WishlistItemDto[]>(API_ROUTES.wishlist.list);
  },

  async createItem(input: UpsertWishlistItemInput): Promise<WishlistItemDto> {
    return apiClient.post<WishlistItemDto>(API_ROUTES.wishlist.list, input);
  },

  async updateItem(id: string, input: UpsertWishlistItemInput): Promise<WishlistItemDto> {
    return apiClient.put<WishlistItemDto>(API_ROUTES.wishlist.byId(id), input);
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete<void>(API_ROUTES.wishlist.byId(id));
  }
};
