export const authPaths = {
  "/auth/token": {
    post: {
      tags: ["Auth"],
      summary: "(Dev) Obtener access token con email+password",
      description: "Endpoint de desarrollo: acepta email+password y devuelve { accessToken } cuando NODE_ENV=development.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Token devuelto",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TokenResponse" },
            },
          },
        },
        "403": {
          description: "Forbidden (not development)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Registro con email y password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Sesion creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSession" },
            },
          },
        },
        "400": {
          description: "Solicitud invalida",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login con email y password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Sesion creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSession" },
            },
          },
        },
        "401": {
          description: "Credenciales invalidas",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/session": {
    get: {
      tags: ["Auth"],
      summary: "Obtener usuario de la sesion",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Sesion activa",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  user: { $ref: "#/components/schemas/User" },
                },
                required: ["user"],
              },
            },
          },
        },
        "401": {
          description: "Token invalido",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Renovar tokens",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Tokens renovados",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSession" },
            },
          },
        },
        "401": {
          description: "Refresh token invalido",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Cerrar sesion",
      responses: {
        "204": { description: "Sesion cerrada" },
      },
    },
  },
  "/auth/oauth/google": {
    post: {
      tags: ["Auth"],
      summary: "Login con Google ID token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/GoogleOAuthRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Sesion creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSession" },
            },
          },
        },
        "401": {
          description: "Token invalido",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/oauth/apple": {
    post: {
      tags: ["Auth"],
      summary: "Login con Apple identity token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AppleOAuthRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Sesion creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSession" },
            },
          },
        },
        "401": {
          description: "Token invalido",
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
