import { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { goalsRepository } from './goals.repository.js';
import {
  createGoalSchema,
  goalIdParamsSchema,
  updateGoalSchema,
} from './goals.schemas.js';

export const goalsController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await goalsRepository.listGoalsForUser(userId);
    const mapped = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    }));
    res.json(mapped);
  },

  async create(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const body = createGoalSchema.parse(req.body);
    const row = await goalsRepository.createGoal(userId, body);
    res.status(201).json({
      id: row.id,
      title: row.title,
      description: row.description,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    });
  },

  async update(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const { id } = goalIdParamsSchema.parse(req.params);
    const body = updateGoalSchema.parse(req.body);
    const row = await goalsRepository.updateGoal(userId, id, body);
    if (!row) {
      throw new HttpError(404, 'No se encontró la meta.');
    }
    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    });
  },

  async remove(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const { id } = goalIdParamsSchema.parse(req.params);
    const deleted = await goalsRepository.deleteGoal(userId, id);
    if (!deleted) {
      throw new HttpError(404, 'No se encontró la meta.');
    }
    res.status(204).send();
  },
};
