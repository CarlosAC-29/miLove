import type { Request, Response } from "express";
import { addMemberSchema, createCoupleSchema } from "./couples.schemas.js";
import { couplesService } from "./couples.service.js";

export const couplesController = {
  async create(request: Request, response: Response) {
    const body = createCoupleSchema.parse(request.body);
    const data = await couplesService.create(request.auth!.sub, body.name);
    return response.status(201).json(data);
  },

  async listMine(request: Request, response: Response) {
    const data = await couplesService.listMine(request.auth!.sub);
    return response.json(data);
  },

  async addMember(request: Request, response: Response) {
    const body = addMemberSchema.parse(request.body);
    const data = await couplesService.addMember(request.params.coupleId, body);
    return response.status(201).json(data);
  },
};
