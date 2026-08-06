import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(120);
const avatarSchema = z.union([z.literal(""), z.string().trim().url().max(2048)]).optional().default("");

export const updateMeSchema = z.object({
  name: nameSchema,
  avatar: avatarSchema,
});
