export const couplesPaths = {
  "/couples": {
    get: {
      tags: ["Couples"],
      summary: "Listar parejas del usuario",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Lista de parejas",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Couple" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Couples"],
      summary: "Crear pareja",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCoupleRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Pareja creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Couple" },
            },
          },
        },
      },
    },
  },
  "/couples/{coupleId}/members": {
    post: {
      tags: ["Couples"],
      summary: "Agregar miembro a pareja",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "coupleId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddMemberRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Miembro agregado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CoupleMember" },
            },
          },
        },
      },
    },
  },
} as const;
