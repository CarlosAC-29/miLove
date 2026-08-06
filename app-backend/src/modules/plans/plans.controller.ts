import { Request, Response } from 'express';
import { plansRepository } from './plans.repository.js';

export const plansController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await plansRepository.listAcceptedPlansForUser(userId);
    const mapped = rows.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      startAt: row.startAt,
      owner: { id: row.owner_id, name: row.owner_name },
    }));
    res.json(mapped);
  },
};
