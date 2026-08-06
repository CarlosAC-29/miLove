import { apiConfig } from "./config";
import { API_ROUTES } from "./config";
import { ApiError, toApiError } from "./errors";
import { sessionStorageService } from "@/services/auth/session.storage";
import type { AuthSession, User } from "@/entities/user/types";
import { trackSlowRequest } from "@/stores/slow-request.store";

export interface RequestOptions {
  readonly query?: Record<string, string | number | boolean | undefined>;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${apiConfig.baseUrl}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function shouldSkipRefresh(path: string): boolean {
  return (
    path === API_ROUTES.auth.login ||
    path === API_ROUTES.auth.register ||
    path === API_ROUTES.auth.refresh ||
    path === API_ROUTES.auth.logout ||
    path === API_ROUTES.auth.google ||
    path === API_ROUTES.auth.apple ||
    path === "/auth/token"
  );
}

function forceLogout(): void {
  sessionStorageService.clear();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function tryRefreshSession(): Promise<boolean> {
  const currentSession = sessionStorageService.read();
  if (!currentSession?.refreshToken) return false;

  const response = await fetch(buildUrl(API_ROUTES.auth.refresh), {
    method: "POST",
    headers: apiConfig.defaultHeaders,
    body: JSON.stringify({ refreshToken: currentSession.refreshToken })
  });

  if (!response.ok) return false;

  const payload = (await response.json()) as Partial<AuthSession> & { accessToken?: string };
  if (!payload.accessToken) return false;

  const refreshedSession: AuthSession = {
    user: (payload.user as User | undefined) ?? currentSession.user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? currentSession.refreshToken,
    ...(payload.expiresAt ? { expiresAt: payload.expiresAt } : {})
  };
  sessionStorageService.write(refreshedSession);
  return true;
}

async function request<TResponse>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
  retried = false
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  const finishSlowRequest = trackSlowRequest();

  try {
    const authHeaders = sessionStorageService.authHeader();
    const response = await fetch(buildUrl(path, options.query), {
      method,
      headers: { ...apiConfig.defaultHeaders, ...authHeaders, ...options.headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: options.signal ?? controller.signal
    });

    if (response.status === 401 && !retried && !shouldSkipRefresh(path)) {
      const refreshed = await tryRefreshSession().catch(() => false);
      if (refreshed) {
        return request<TResponse>(method, path, body, options, true);
      }
      forceLogout();
    }

    if (!response.ok) {
      throw new ApiError({
        message: `Error ${response.status} al llamar ${path}`,
        status: response.status,
        details: await response.text().catch(() => undefined)
      });
    }

    if (response.status === 204) return undefined as TResponse;
    return (await response.json()) as TResponse;
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timeout);
    finishSlowRequest();
  }
}

/**
 * API Client centralizado. Los servicios de dominio son sus únicos consumidores;
 * los componentes jamás lo usan directamente.
 */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options)
};
