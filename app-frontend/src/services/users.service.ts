import { env } from "@/app/config/env";
import { MOCK_PARTNER, MOCK_USER } from "@/entities/user/mock/users.mock";
import { mapUser, type User, type UserDto } from "@/entities/user/types";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

interface UpdateMeInput {
  name: string;
  avatar?: string;
}

let demoUser: UserDto = { ...MOCK_USER };

export const usersService = {
  async getMyPartner(): Promise<User | null> {
    if (env.useMocks) return mapUser(MOCK_PARTNER);
    const response = await apiClient.get<UserDto | null>(API_ROUTES.users.partner);
    return response ? mapUser(response) : null;
  },

  async updateMe(input: UpdateMeInput): Promise<User> {
    if (env.useMocks) {
      demoUser = { ...demoUser, ...input };
      return mapUser(demoUser);
    }
    const response = await apiClient.put<UserDto>(API_ROUTES.users.me, input);
    return mapUser(response);
  }
};
