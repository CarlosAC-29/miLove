import { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { datesRepository } from './dates.repository.js';
import {
  appointmentIdParamsSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
} from './dates.schemas.js';

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

  async create(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const body = createAppointmentSchema.parse(req.body);
    const row = await datesRepository.createManualAppointment(userId, body);

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
    const { id } = appointmentIdParamsSchema.parse(req.params);
    const body = updateAppointmentSchema.parse(req.body);
    const row = await datesRepository.updateAppointment(userId, id, body);

    if (!row) {
      throw new HttpError(404, 'No se encontró la cita para editar.');
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
    const { id } = appointmentIdParamsSchema.parse(req.params);
    const deleted = await datesRepository.deleteAppointment(userId, id);

    if (!deleted) {
      throw new HttpError(404, 'No se encontró la cita para eliminar.');
    }

    res.status(204).send();
  },
};
