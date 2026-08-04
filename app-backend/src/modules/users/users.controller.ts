import type { Request, Response } from "express";
import { usersService } from "./users.service.js";

export const usersController = {
  async me(request: Request, response: Response) {
    const data = await usersService.me(request.auth!.sub);
    return response.json(data);
  },
};
