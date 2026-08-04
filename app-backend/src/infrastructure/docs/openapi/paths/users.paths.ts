export const usersPaths = {
  "/users/me": {
    get: {
      tags: ["Users"],
      summary: "Usuario autenticado",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Perfil",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        "401": {
          description: "No autenticado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
} as const;
