import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/http-error.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return response.status(500).json({ message: "Internal server error." });
}
