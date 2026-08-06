import { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { restaurantsRepository } from './restaurants.repository.js';
import {
  createRestaurantSchema,
  restaurantIdParamsSchema,
  updateRestaurantSchema,
} from './restaurants.schemas.js';

export const restaurantsController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await restaurantsRepository.listRestaurantsForUser(userId);
    const mapped = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      startAt: r.startAt,
      endAt: r.endAt,
      owner: { id: r.owner_id, name: r.owner_name },
    }));
    res.json(mapped);
  },

  async create(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const body = createRestaurantSchema.parse(req.body);
    const row = await restaurantsRepository.createManualRestaurant(userId, body);

    res.status(201).json({
      id: row.id,
      title: row.title,
      description: row.description,
      startAt: row.startAt,
      endAt: row.endAt,
      owner: { id: row.owner_id, name: row.owner_name },
    });
  },

  async update(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const { id } = restaurantIdParamsSchema.parse(req.params);
    const body = updateRestaurantSchema.parse(req.body);
    const row = await restaurantsRepository.updateRestaurant(userId, id, body);

    if (!row) {
      throw new HttpError(404, 'No se encontró el restaurante para editar.');
    }

    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      startAt: row.startAt,
      endAt: row.endAt,
      owner: { id: row.owner_id, name: row.owner_name },
    });
  },

  async remove(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const { id } = restaurantIdParamsSchema.parse(req.params);
    const deleted = await restaurantsRepository.deleteRestaurant(userId, id);

    if (!deleted) {
      throw new HttpError(404, 'No se encontró el restaurante para eliminar.');
    }

    res.status(204).send();
  },
};
