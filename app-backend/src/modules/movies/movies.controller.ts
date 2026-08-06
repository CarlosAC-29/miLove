import { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { moviesRepository } from './movies.repository.js';
import {
  createMovieSchema,
  movieIdParamsSchema,
  updateMovieSchema,
} from './movies.schemas.js';

export const moviesController = {
  async list(req: Request, res: Response) {
    const userId = req.auth!.sub as string;
    const rows = await moviesRepository.listMoviesForUser(userId);
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
    const body = createMovieSchema.parse(req.body);
    const row = await moviesRepository.createManualMovie(userId, body);

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
    const { id } = movieIdParamsSchema.parse(req.params);
    const body = updateMovieSchema.parse(req.body);
    const row = await moviesRepository.updateMovie(userId, id, body);

    if (!row) {
      throw new HttpError(404, 'No se encontró la película para editar.');
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
    const { id } = movieIdParamsSchema.parse(req.params);
    const deleted = await moviesRepository.deleteMovie(userId, id);

    if (!deleted) {
      throw new HttpError(404, 'No se encontró la película para eliminar.');
    }

    res.status(204).send();
  },
};
