import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(160);
const descriptionSchema = z.string().trim().max(2000).optional().default("");
const startAtSchema = z.string().datetime({ offset: true });

export const movieIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createMovieSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  startAt: startAtSchema,
});

export const updateMovieSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  startAt: startAtSchema,
});
