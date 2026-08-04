export const healthPaths = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Estado del backend",
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HealthResponse" },
            },
          },
        },
      },
    },
  },
} as const;
