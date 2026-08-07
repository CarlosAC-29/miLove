export const openApiSchemas = {
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Invalid credentials." },
    },
    required: ["message"],
  },
  HealthResponse: {
    type: "object",
    properties: {
      status: { type: "string", example: "ok" },
    },
    required: ["status"],
  },
  User: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      avatar: { type: "string", nullable: true },
      provider: { type: "string", enum: ["google", "apple", "email"] },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "name", "email", "provider", "createdAt"],
  },
  UpdateMeRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 120 },
      avatar: { type: "string", format: "uri", nullable: true },
    },
    required: ["name"],
  },
  AuthSession: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/User" },
      accessToken: { type: "string" },
      refreshToken: { type: "string" },
      expiresAt: { type: "string", format: "date-time" },
    },
    required: ["user", "accessToken", "refreshToken", "expiresAt"],
  },
  RegisterRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2, example: "Carlos" },
      email: { type: "string", format: "email", example: "carlos@example.com" },
      password: { type: "string", minLength: 6, example: "123456" },
      registrationCode: { type: "string", minLength: 1 },
    },
    required: ["name", "email", "password", "registrationCode"],
  },
  LoginRequest: {
    type: "object",
    properties: {
      email: { type: "string", format: "email", example: "carlos@example.com" },
      password: { type: "string", minLength: 6, example: "123456" },
    },
    required: ["email", "password"],
  },
  TokenResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string", example: "eyJhbGci..." },
    },
    required: ["accessToken"],
  },
  RefreshRequest: {
    type: "object",
    properties: {
      refreshToken: { type: "string" },
    },
    required: ["refreshToken"],
  },
  GoogleOAuthRequest: {
    type: "object",
    properties: {
      idToken: { type: "string" },
    },
    required: ["idToken"],
  },
  AppleOAuthRequest: {
    type: "object",
    properties: {
      identityToken: { type: "string" },
    },
    required: ["identityToken"],
  },
  Couple: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "name", "createdAt"],
  },
  CoupleMember: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      coupleId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid", nullable: true },
      externalMemberId: { type: "string", nullable: true },
      displayName: { type: "string" },
      contributionAmount: { type: "number" },
    },
    required: ["id", "coupleId", "displayName", "contributionAmount"],
  },
  CreateCoupleRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2, example: "Hogar Carlos y Ana" },
    },
    required: ["name"],
  },
  AddMemberRequest: {
    type: "object",
    properties: {
      displayName: { type: "string", minLength: 2, example: "Ana" },
      userId: { type: "string", format: "uuid", nullable: true },
      externalMemberId: { type: "string", nullable: true },
      contributionAmount: { type: "number", minimum: 0, example: 350000 },
    },
    required: ["displayName"],
  },
  Transaction: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      amount: { type: "number" },
      type: { type: "string", enum: ["income", "expense"] },
      category: { type: "string" },
      isFixed: { type: "boolean" },
      description: { type: "string" },
      date: { type: "string", format: "date" },
      context: { type: "string", enum: ["personal", "household"] },
      ownerId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "amount",
      "type",
      "category",
      "isFixed",
      "description",
      "date",
      "context",
      "ownerId",
      "createdAt",
    ],
  },
  CreateTransactionRequest: {
    type: "object",
    properties: {
      amount: { type: "number", exclusiveMinimum: 0 },
      type: { type: "string", enum: ["income", "expense"] },
      category: { type: "string", minLength: 1 },
      isFixed: { type: "boolean" },
      description: { type: "string", minLength: 1 },
      date: { type: "string", example: "2026-08-04" },
      context: { type: "string", enum: ["personal", "household"] },
      ownerId: { type: "string", minLength: 1 },
    },
    required: ["amount", "type", "category", "description", "date", "context", "ownerId"],
  },
  UpdateTransactionRequest: {
    type: "object",
    properties: {
      amount: { type: "number", exclusiveMinimum: 0 },
      type: { type: "string", enum: ["income", "expense"] },
      category: { type: "string", minLength: 1 },
      isFixed: { type: "boolean" },
      description: { type: "string", minLength: 1 },
      date: { type: "string", example: "2026-08-04" },
      context: { type: "string", enum: ["personal", "household"] },
      ownerId: { type: "string", minLength: 1 },
    },
  },
  ExtendFixedTransactionsRequest: {
    type: "object",
    properties: {
      context: { type: "string", enum: ["personal", "household"] },
      month: { type: "string", example: "2026-08" },
    },
    required: ["context", "month"],
  },
  ExtendFixedTransactionsResponse: {
    type: "object",
    properties: {
      created: { type: "integer", minimum: 0 },
    },
    required: ["created"],
  },
  Budget: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      categoryId: { type: "string" },
      amount: { type: "number" },
      spent: { type: "number" },
      month: { type: "string", example: "2026-08" },
      context: { type: "string", enum: ["personal", "household"] },
    },
    required: ["id", "name", "categoryId", "amount", "spent", "month", "context"],
  },
  CreateBudgetRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      categoryId: { type: "string", minLength: 1 },
      amount: { type: "number", exclusiveMinimum: 0 },
      month: { type: "string", example: "2026-08" },
      context: { type: "string", enum: ["personal", "household"] },
    },
    required: ["name", "categoryId", "amount", "month", "context"],
  },
  UpdateBudgetRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      categoryId: { type: "string", minLength: 1 },
      amount: { type: "number", exclusiveMinimum: 0 },
      month: { type: "string", example: "2026-08" },
      context: { type: "string", enum: ["personal", "household"] },
    },
  },
  Goal: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      targetAmount: { type: "number" },
      currentAmount: { type: "number" },
      context: { type: "string", enum: ["personal", "household"] },
      deadline: { type: "string", format: "date", nullable: true },
      isOwner: { type: "boolean" },
      contributions: {
        type: "array",
        items: { $ref: "#/components/schemas/GoalContribution" },
      },
    },
    required: ["id", "name", "targetAmount", "currentAmount", "context"],
  },
  GoalContribution: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      amount: { type: "number" },
      month: { type: "string", example: "2026-08" },
      isShared: { type: "boolean" },
    },
    required: ["id", "amount", "month", "isShared"],
  },
  CreateGoalRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      targetAmount: { type: "number", exclusiveMinimum: 0 },
      currentAmount: { type: "number", minimum: 0 },
      context: { type: "string", enum: ["personal", "household"] },
      deadline: { type: "string", example: "2026-12-31" },
    },
    required: ["name", "targetAmount", "currentAmount", "context"],
  },
  CreateGoalContributionRequest: {
    type: "object",
    properties: {
      amount: { type: "number", exclusiveMinimum: 0 },
      month: { type: "string", example: "2026-08" },
      isShared: { type: "boolean", default: false },
    },
    required: ["amount", "month"],
  },
  UpdateGoalRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      targetAmount: { type: "number", exclusiveMinimum: 0 },
      deadline: { type: "string", format: "date", nullable: true },
    },
  },
  Summary: {
    type: "object",
    properties: {
      income: { type: "number" },
      expenses: { type: "number" },
      fixedExpenses: { type: "number" },
      savings: { type: "number" },
      balance: { type: "number" },
    },
    required: ["income", "expenses", "fixedExpenses", "savings", "balance"],
  },
  HouseholdMember: {
    type: "object",
    properties: {
      memberId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid", nullable: true },
      memberName: { type: "string" },
      amount: { type: "number" },
    },
    required: ["memberId", "memberName", "amount"],
  },
  HouseholdProfile: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      members: {
        type: "array",
        items: { $ref: "#/components/schemas/HouseholdMember" },
      },
    },
    required: ["id", "name", "members"],
  },
  Insight: {
    type: "object",
    properties: {
      id: { type: "string", nullable: true },
      title: { type: "string" },
      message: { type: "string" },
      createdAt: { type: "string", format: "date-time", nullable: true },
    },
    required: ["title", "message"],
  },
  UpdateContributionRequest: {
    type: "object",
    properties: {
      amount: { type: "number", minimum: 0, example: 150000 },
    },
    required: ["amount"],
  },
  RecommendationContext: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      module: { type: "string", enum: ["dates", "gifts", "movies", "restaurants"] },
      context: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "module", "context", "createdAt", "updatedAt"],
  },
  RecommendationSuggestion: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      contextId: { type: "string", format: "uuid" },
      category: { type: "string", enum: ["date", "restaurant", "activity", "gift", "trip"] },
      title: { type: "string" },
      message: { type: "string" },
      accepted: { type: "boolean" },
      acceptedAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "contextId", "category", "title", "message", "accepted", "createdAt"],
  },
  RecommendationContextState: {
    type: "object",
    properties: {
      context: {
        oneOf: [{ $ref: "#/components/schemas/RecommendationContext" }, { type: "null" }],
      },
      suggestions: {
        type: "object",
        properties: {
          total: { type: "number" },
          accepted: { type: "number" },
          pending: { type: "number" },
        },
        required: ["total", "accepted", "pending"],
      },
    },
    required: ["context", "suggestions"],
  },
  UpsertRecommendationContextRequest: {
    type: "object",
    properties: {
      context: { type: "string", minLength: 10, maxLength: 2000 },
      module: { type: "string", enum: ["dates", "gifts", "movies", "restaurants"] },
    },
    required: ["context", "module"],
  },
  GenerateRecommendationsRequest: {
    type: "object",
    properties: {
      context: { type: "string", minLength: 10, maxLength: 2000 },
      category: { type: "string", enum: ["date", "restaurant", "activity", "gift", "trip"] },
      module: { type: "string", enum: ["dates", "gifts", "movies", "restaurants"] },
    },
    required: ["module"],
  },
  AcceptSuggestionsRequest: {
    type: "object",
    properties: {
      suggestionIds: {
        type: "array",
        minItems: 1,
        items: { type: "string", format: "uuid" },
      },
    },
    required: ["suggestionIds"],
  },
  GenerateSuggestionsResponse: {
    type: "object",
    properties: {
      context: { $ref: "#/components/schemas/RecommendationContext" },
      suggestions: {
        type: "array",
        items: { $ref: "#/components/schemas/RecommendationSuggestion" },
      },
    },
    required: ["context", "suggestions"],
  },
} as const;
