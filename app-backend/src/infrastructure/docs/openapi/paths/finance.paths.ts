export const financePaths = {
  "/finance/transactions": {
    get: {
      tags: ["Finance"],
      summary: "Listar transacciones",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "context",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["personal", "household"] },
        },
        {
          name: "month",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-08" },
        },
      ],
      responses: {
        "200": {
          description: "Transacciones",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Transaction" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Finance"],
      summary: "Crear transaccion",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateTransactionRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Transaccion creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Transaction" },
            },
          },
        },
      },
    },
  },
  "/finance/transactions/{id}": {
    put: {
      tags: ["Finance"],
      summary: "Actualizar transaccion",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateTransactionRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Transaccion actualizada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Transaction" },
            },
          },
        },
        "404": {
          description: "Transaccion no encontrada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Finance"],
      summary: "Eliminar transaccion",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "204": { description: "Transaccion eliminada" },
      },
    },
  },
  "/finance/transactions/extend-fixed": {
    post: {
      tags: ["Finance"],
      summary: "Extender movimientos fijos por tres meses",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ExtendFixedTransactionsRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Movimientos fijos extendidos",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExtendFixedTransactionsResponse" },
            },
          },
        },
      },
    },
  },
  "/finance/summary": {
    get: {
      tags: ["Finance"],
      summary: "Resumen financiero",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "context",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["personal", "household"] },
        },
        {
          name: "month",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-08" },
        },
      ],
      responses: {
        "200": {
          description: "Resumen",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Summary" },
            },
          },
        },
      },
    },
  },
  "/finance/budgets": {
    get: {
      tags: ["Finance"],
      summary: "Listar presupuestos",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "context",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["personal", "household"] },
        },
        {
          name: "month",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-08" },
        },
      ],
      responses: {
        "200": {
          description: "Presupuestos",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Budget" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Finance"],
      summary: "Crear presupuesto",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateBudgetRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Presupuesto creado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Budget" },
            },
          },
        },
      },
    },
  },
  "/finance/budgets/{id}": {
    put: {
      tags: ["Finance"],
      summary: "Actualizar presupuesto",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateBudgetRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Presupuesto actualizado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Budget" },
            },
          },
        },
        "404": {
          description: "Presupuesto no encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Finance"],
      summary: "Eliminar presupuesto",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "204": { description: "Presupuesto eliminado" },
        "404": {
          description: "Presupuesto no encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/finance/goals": {
    get: {
      tags: ["Finance"],
      summary: "Listar metas",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "context",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["personal", "household"] },
        },
      ],
      responses: {
        "200": {
          description: "Metas",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Goal" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Finance"],
      summary: "Crear meta",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateGoalRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Meta creada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Goal" },
            },
          },
        },
      },
    },
  },
  "/finance/goals/{id}/contributions": {
    post: {
      tags: ["Finance"],
      summary: "Registrar aporte a una meta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateGoalContributionRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Aporte registrado" },
        "404": {
          description: "Meta no encontrada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/finance/goals/{id}": {
    put: {
      tags: ["Finance"],
      summary: "Editar meta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateGoalRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Meta actualizada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Goal" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Finance"],
      summary: "Eliminar meta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "204": { description: "Meta eliminada" },
      },
    },
  },
  "/finance/goals/{id}/contributions/{contributionId}": {
    put: {
      tags: ["Finance"],
      summary: "Editar aporte de una meta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "contributionId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateGoalContributionRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Aporte actualizado" },
      },
    },
    delete: {
      tags: ["Finance"],
      summary: "Eliminar aporte de una meta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "contributionId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "204": { description: "Aporte eliminado" },
      },
    },
  },
  "/finance/household": {
    get: {
      tags: ["Finance"],
      summary: "Perfil financiero del hogar",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Perfil del hogar",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HouseholdProfile" },
            },
          },
        },
      },
    },
  },
  "/finance/household/contributions/{memberId}": {
    put: {
      tags: ["Finance"],
      summary: "Actualizar aporte de miembro",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "memberId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateContributionRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Perfil del hogar actualizado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HouseholdProfile" },
            },
          },
        },
        "404": {
          description: "Miembro no encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/finance/insights": {
    get: {
      tags: ["Finance"],
      summary: "Insights financieros",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "context",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["personal", "household"], default: "personal" },
        },
        {
          name: "month",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-08" },
        },
      ],
      responses: {
        "200": {
          description: "Listado de insights",
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
