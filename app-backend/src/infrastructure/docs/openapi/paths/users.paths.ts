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
    put: {
      tags: ["Users"],
      summary: "Actualizar perfil autenticado",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateMeRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Perfil actualizado",
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
  "/users/me/partner": {
    get: {
      tags: ["Users"],
      summary: "Pareja del usuario autenticado",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Perfil de la pareja o null si no hay una relación configurada",
          content: {
            "application/json": {
              schema: {
                oneOf: [{ $ref: "#/components/schemas/User" }, { type: "null" }],
              },
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
