import { apiConfig } from "./config";
import { ApiError, toApiError } from "./errors";
import { sessionStorageService } from "@/services/auth/session.storage";

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

async function request<TResponse>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  try {
    const authHeaders = sessionStorageService.authHeader();
    const response = await fetch(buildUrl(path, options.query), {
      method,
      headers: { ...apiConfig.defaultHeaders, ...authHeaders, ...options.headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: options.signal ?? controller.signal,
    });

    if (!response.ok) {
      throw new ApiError({
        message: `Error ${response.status} al llamar ${path}`,
        status: response.status,
        details: await response.text().catch(() => undefined),
      });
    }

    if (response.status === 204) return undefined as TResponse;
    return (await response.json()) as TResponse;
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timeout);
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
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
