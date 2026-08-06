import { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { wishlistRepository } from './wishlist.repository.js';
import {
  createWishlistItemSchema,
  updateWishlistItemSchema,
  wishlistItemIdParamsSchema,
} from './wishlist.schemas.js';

export const wishlistController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await wishlistRepository.listItemsForUser(userId);
    const mapped = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      webUrl: row.webUrl,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    }));
    res.json(mapped);
  },

  async create(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const body = createWishlistItemSchema.parse(req.body);
    const row = await wishlistRepository.createItem(userId, body);
    res.status(201).json({
      id: row.id,
      title: row.title,
      description: row.description,
      webUrl: row.webUrl,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    });
  },

  async update(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const { id } = wishlistItemIdParamsSchema.parse(req.params);
    const body = updateWishlistItemSchema.parse(req.body);
    const row = await wishlistRepository.updateItem(userId, id, body);
    if (!row) {
      throw new HttpError(404, 'No se encontró el elemento de wishlist.');
    }
    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      webUrl: row.webUrl,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    });
  },

  async remove(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const { id } = wishlistItemIdParamsSchema.parse(req.params);
    const deleted = await wishlistRepository.deleteItem(userId, id);
    if (!deleted) {
      throw new HttpError(404, 'No se encontró el elemento de wishlist.');
    }
    res.status(204).send();
  },
};
