import { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { giftsRepository } from './gifts.repository.js';
import {
  createGiftSchema,
  giftIdParamsSchema,
  updateGiftSchema,
} from './gifts.schemas.js';

export const giftsController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await giftsRepository.listGiftsForUser(userId);
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
    const body = createGiftSchema.parse(req.body);
    const row = await giftsRepository.createManualGift(userId, body);

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
    const { id } = giftIdParamsSchema.parse(req.params);
    const body = updateGiftSchema.parse(req.body);
    const row = await giftsRepository.updateGift(userId, id, body);

    if (!row) {
      throw new HttpError(404, 'No se encontró el regalo para editar.');
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
    const { id } = giftIdParamsSchema.parse(req.params);
    const deleted = await giftsRepository.deleteGift(userId, id);

    if (!deleted) {
      throw new HttpError(404, 'No se encontró el regalo para eliminar.');
    }

    res.status(204).send();
  },
};
