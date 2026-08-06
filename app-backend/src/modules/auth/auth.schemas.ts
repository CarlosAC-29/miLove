import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  registrationCode: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const googleOAuthSchema = z.object({
  idToken: z.string().min(10),
});

export const appleOAuthSchema = z.object({
  identityToken: z.string().min(10),
});
