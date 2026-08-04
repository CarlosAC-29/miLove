import { authPaths } from "./openapi/paths/auth.paths.js";
import { couplesPaths } from "./openapi/paths/couples.paths.js";
import { financePaths } from "./openapi/paths/finance.paths.js";
import { healthPaths } from "./openapi/paths/health.paths.js";
import { recommendationsPaths } from "./openapi/paths/recommendations.paths.js";
import { usersPaths } from "./openapi/paths/users.paths.js";
import { openApiSchemas } from "./openapi/schemas.js";

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "MiLove Backend API",
    version: "1.0.0",
    description: "Documentacion Swagger de los endpoints actuales del backend MiLove.",
  },
  servers: [
    {
      url: "http://localhost:4000/api",
      description: "Local",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Couples" },
    { name: "Finance" },
    { name: "Recommendations" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: openApiSchemas,
  },
  paths: {
    ...healthPaths,
    ...authPaths,
    ...usersPaths,
    ...couplesPaths,
    ...financePaths,
    ...recommendationsPaths,
  },
} as const;
