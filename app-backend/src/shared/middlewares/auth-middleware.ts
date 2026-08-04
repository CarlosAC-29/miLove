import type { NextFunction, Request, Response } from "express";
import { supabaseAuth } from "../../infrastructure/supabase/client.js";
import { HttpError } from "../errors/http-error.js";

export interface AuthPayload {
  sub: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing authorization token.");
  }

  const token = header.slice("Bearer ".length);
  void supabaseAuth.auth
    .getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user) {
        next(new HttpError(401, "Invalid authorization token."));
        return;
      }
      request.auth = { sub: data.user.id };
      next();
    })
    .catch(() => {
      next(new HttpError(401, "Invalid authorization token."));
    });
}
