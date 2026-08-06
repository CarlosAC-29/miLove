import type { Request, Response } from "express";
import { usersService } from "./users.service.js";
import { updateMeSchema } from "./users.schemas.js";

export const usersController = {
  async me(request: Request, response: Response) {
    const data = await usersService.me(request.auth!.sub);
    return response.json(data);
  },

  async myPartner(request: Request, response: Response) {
    const data = await usersService.getMyPartner(request.auth!.sub);
    return response.json(data);
  },

  async updateMe(request: Request, response: Response) {
    const input = updateMeSchema.parse(request.body);
    const data = await usersService.updateMe(request.auth!.sub, input);
    return response.json(data);
  },
};
