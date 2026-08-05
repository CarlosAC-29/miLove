import { Request, Response } from 'express';
import { datesRepository } from './dates.repository.js';

export const datesController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await datesRepository.listAppointmentsForUser(userId);
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
};
