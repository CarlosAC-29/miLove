import { HttpError } from "../../shared/errors/http-error.js";
import { usersRepository } from "./users.repository.js";

export const usersService = {
  async me(userId: string) {
    const user = await usersRepository.getById(userId);
    if (!user) throw new HttpError(404, "User not found.");
    return user;
  },

  getMyPartner(userId: string) {
    return usersRepository.getPartnerByUserId(userId);
  },

  async updateMe(userId: string, input: { name: string; avatar: string }) {
    const user = await usersRepository.updateById(userId, input);
    if (!user) throw new HttpError(404, "User not found.");
    return user;
  },
};
