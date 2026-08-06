import { mapUser, type User, type UserDto } from "@/entities/user/types";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

interface UpdateMeInput {
  name: string;
  avatar?: string;
}

export const usersService = {
  async getMyPartner(): Promise<User | null> {
    const response = await apiClient.get<UserDto | null>(API_ROUTES.users.partner);
    return response ? mapUser(response) : null;
  },

  async updateMe(input: UpdateMeInput): Promise<User> {
    const response = await apiClient.put<UserDto>(API_ROUTES.users.me, input);
    return mapUser(response);
  }
};
