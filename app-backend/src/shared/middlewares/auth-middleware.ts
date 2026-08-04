import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
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
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    request.auth = { sub: payload.sub };
    next();
  } catch {
    throw new HttpError(401, "Invalid authorization token.");
  }
}
