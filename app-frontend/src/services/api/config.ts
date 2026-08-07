import { env } from "@/app/config/env";

/** Configuración de transporte del API client. */
export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  timeoutMs: env.apiTimeoutMs,
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json"
  } as Record<string, string>
};

/** Rutas REST del backend futuro, centralizadas para evitar strings mágicos. */
export const API_ROUTES = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    session: "/auth/session",
    refresh: "/auth/refresh",
    google: "/auth/oauth/google",
    apple: "/auth/oauth/apple"
  },
  finance: {
    transactions: "/finance/transactions",
    extendFixedTransactions: "/finance/transactions/extend-fixed",
    summary: "/finance/summary",
    budgets: "/finance/budgets",
    budgetById: (id: string) => `/finance/budgets/${id}`,
    goals: "/finance/goals",
    goalById: (id: string) => `/finance/goals/${id}`,
    goalContributions: (id: string) => `/finance/goals/${id}/contributions`,
    goalContributionById: (goalId: string, contributionId: string) =>
      `/finance/goals/${goalId}/contributions/${contributionId}`,
    household: "/finance/household",
    insights: "/finance/insights"
  },
  gifts: { list: "/gifts", byId: (id: string) => `/gifts/${id}` },
  goals: { list: "/goals", byId: (id: string) => `/goals/${id}` },
  dates: { list: "/dates", ideas: "/dates/ideas", byId: (id: string) => `/dates/${id}` },
  plans: { list: "/plans" },
  movies: { list: "/movies", byId: (id: string) => `/movies/${id}` },
  restaurants: { list: "/restaurants", byId: (id: string) => `/restaurants/${id}` },
  wishlist: { list: "/wishlist", byId: (id: string) => `/wishlist/${id}` },
  recommendations: {
    ai: "/recommendations/ai",
    context: "/recommendations/context",
    suggestions: "/recommendations/suggestions",
    generate: "/recommendations/suggestions/generate",
    accept: "/recommendations/suggestions/accept"
  },
  users: { me: "/users/me", partner: "/users/me/partner" }
} as const;
