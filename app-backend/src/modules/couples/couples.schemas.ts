import { z } from "zod";

export const createCoupleSchema = z.object({
  name: z.string().min(2),
});

export const addMemberSchema = z.object({
  displayName: z.string().min(2),
  userId: z.string().uuid().optional(),
  externalMemberId: z.string().optional(),
  contributionAmount: z.number().nonnegative().default(0),
});
