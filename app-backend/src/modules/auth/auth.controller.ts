import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import {
  appleOAuthSchema,
  googleOAuthSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.schemas.js";

export const authController = {
  async register(request: Request, response: Response) {
    const body = registerSchema.parse(request.body);
    const session = await authService.register(body);
    return response.status(201).json(session);
  },

  async login(request: Request, response: Response) {
    const body = loginSchema.parse(request.body);
    const session = await authService.login(body);
    return response.json(session);
  },

  async session(request: Request, response: Response) {
    const auth = request.auth!;
    const session = await authService.getSession(auth.sub);
    return response.json(session);
  },

  async refresh(request: Request, response: Response) {
    const body = refreshSchema.parse(request.body);
    const session = await authService.refresh(body.refreshToken);
    return response.json(session);
  },

  async logout(request: Request, response: Response) {
    void request.body;
    await authService.logout();
    return response.status(204).send();
  },

  async google(request: Request, response: Response) {
    const body = googleOAuthSchema.parse(request.body);
    const session = await authService.oauthGoogle(body.idToken);
    return response.json(session);
  },

  async apple(request: Request, response: Response) {
    const body = appleOAuthSchema.parse(request.body);
    const session = await authService.oauthApple(body.identityToken);
    return response.json(session);
  },

  // Dev helper: exchange email+password for a short-lived access token only.
  // This endpoint is intentionally available only in development to avoid exposing
  // credentials in production. It validates the same login schema and returns
  // { accessToken }.
  async token(request: Request, response: Response) {
    if (process.env.NODE_ENV !== "development") {
      return response.status(403).json({ message: "Forbidden" });
    }
    const body = loginSchema.parse(request.body);
    const session = await authService.login(body);
    return response.json({ accessToken: session.accessToken });
  },
};
