export const recommendationsPaths = {
  "/recommendations/context": {
    get: {
      tags: ["Recommendations"],
      summary: "Obtener contexto actual y estado de sugerencias",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "module",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["dates", "gifts", "movies", "restaurants"] },
        },
      ],
      responses: {
        "200": {
          description: "Estado de recomendaciones",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RecommendationContextState" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Recommendations"],
      summary: "Crear o editar contexto",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpsertRecommendationContextRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Contexto guardado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RecommendationContext" },
            },
          },
        },
      },
    },
  },
  "/recommendations/suggestions/generate": {
    post: {
      tags: ["Recommendations"],
      summary: "Generar sugerencias desde contexto",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/GenerateRecommendationsRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Sugerencias generadas",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GenerateSuggestionsResponse" },
            },
          },
        },
        "400": {
          description: "Contexto faltante o invalido",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/recommendations/suggestions": {
    get: {
      tags: ["Recommendations"],
      summary: "Listar sugerencias",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "module",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["dates", "gifts", "movies", "restaurants"] },
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["all", "accepted", "pending"],
            default: "all",
          },
        },
      ],
      responses: {
        "200": {
          description: "Listado de sugerencias",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/RecommendationSuggestion" },
              },
            },
          },
        },
      },
    },
  },
  "/recommendations/suggestions/accept": {
    post: {
      tags: ["Recommendations"],
      summary: "Aceptar sugerencias seleccionadas",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AcceptSuggestionsRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Sugerencias aceptadas",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/RecommendationSuggestion" },
              },
            },
          },
        },
        "404": {
          description: "No se encontraron sugerencias",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/recommendations/ai": {
    get: {
      tags: ["Recommendations"],
      summary: "Compatibilidad: listar recomendaciones en formato simple",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Recomendaciones",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Insight" },
              },
            },
          },
        },
      },
    },
  },
} as const;
