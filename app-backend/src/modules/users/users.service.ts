import { HttpError } from "../../shared/errors/http-error.js";
import { usersRepository } from "./users.repository.js";

export const usersService = {
  async me(userId: string) {
    const user = await usersRepository.getById(userId);
    if (!user) throw new HttpError(404, "User not found.");
    return user;
  },
};
