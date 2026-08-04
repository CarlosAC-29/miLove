import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "../config/env.js";
import { errorHandler } from "../shared/middlewares/error-handler.js";
import { appRoutes } from "./routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", appRoutes);
app.use(errorHandler);
