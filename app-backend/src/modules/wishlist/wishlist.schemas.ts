import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(160);
const descriptionSchema = z.string().trim().max(2000).optional().default("");
const webUrlSchema = z.union([z.literal(""), z.string().trim().url().max(2048)]).optional().default("");

export const wishlistItemIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createWishlistItemSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  webUrl: webUrlSchema,
});

export const updateWishlistItemSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  webUrl: webUrlSchema,
});
