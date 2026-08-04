import { env } from "@/app/config/env";

/** Configuración de transporte del API client. */
export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  timeoutMs: env.apiTimeoutMs,
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  } as Record<string, string>,
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
    apple: "/auth/oauth/apple",
  },
  finance: {
    transactions: "/finance/transactions",
    summary: "/finance/summary",
    budgets: "/finance/budgets",
    goals: "/finance/goals",
    household: "/finance/household",
    insights: "/finance/insights",
  },
  gifts: { list: "/gifts" },
  dates: { list: "/dates", ideas: "/dates/ideas" },
  movies: { list: "/movies" },
  restaurants: { list: "/restaurants" },
  recommendations: { ai: "/recommendations/ai" },
} as const;
