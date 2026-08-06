import type { Request, Response } from "express";
import {
  acceptSuggestionsSchema,
  deleteSuggestionsSchema,
  generateSuggestionsSchema,
  listSuggestionsQuerySchema,
  upsertContextSchema,
} from "./recommendations.schemas.js";
import { recommendationsService } from "./recommendations.service.js";

export const recommendationsController = {
  async getContext(request: Request, response: Response) {
    const data = await recommendationsService.getContext(request.auth!.sub);
    return response.json(data);
  },

  async upsertContext(request: Request, response: Response) {
    const body = upsertContextSchema.parse(request.body);
    const data = await recommendationsService.upsertContext(request.auth!.sub, body.context.trim());
    return response.json(data);
  },

  async generateSuggestions(request: Request, response: Response) {
    const body = generateSuggestionsSchema.parse(request.body);
    const data = await recommendationsService.generateSuggestions(request.auth!.sub, {
      context: body.context?.trim(),
      category: body.category,
    });
    return response.status(201).json(data);
  },

  async listSuggestions(request: Request, response: Response) {
    const status = listSuggestionsQuerySchema.parse(request.query.status ?? "all");
    const data = await recommendationsService.listSuggestions(request.auth!.sub, status);
    return response.json(data);
  },

  async acceptSuggestions(request: Request, response: Response) {
    const body = acceptSuggestionsSchema.parse(request.body);
    const data = await recommendationsService.acceptSuggestions(request.auth!.sub, body.suggestionIds);
    return response.json(data);
  },

  async deleteSuggestions(request: Request, response: Response) {
    const body = deleteSuggestionsSchema.parse(request.body);
    const data = await recommendationsService.deleteSuggestions(request.auth!.sub, body.suggestionIds);
    return response.json(data);
  },

  async ai(request: Request, response: Response) {
    const data = await recommendationsService.listAiRecommendations(request.auth!.sub);
    return response.json(data);
  },
};
