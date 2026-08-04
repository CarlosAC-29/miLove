import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "../config/env.js";
import { errorHandler } from "../shared/middlewares/error-handler.js";
import { appRoutes } from "./routes.js";

export const app = express();

app.use(helmet());
const normalizeOrigin = (origin: string): string => origin.replace(/\/+$/, "");
const configuredOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter((origin) => origin.length > 0);
const allowAnyOrigin = configuredOrigins.includes("*");

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || allowAnyOrigin) {
        callback(null, true);
        return;
      }

      const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
      if (configuredOrigins.includes(normalizedRequestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${requestOrigin}`));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", appRoutes);
app.use(errorHandler);
