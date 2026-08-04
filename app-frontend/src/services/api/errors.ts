/** Error normalizado de la capa de datos. La UI nunca ve errores crudos de fetch. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(params: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code ?? "api_error";
    this.details = params.details;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError({ message: "La solicitud tardó demasiado.", status: 408, code: "timeout" });
  }
  return new ApiError({
    message: error instanceof Error ? error.message : "Error inesperado.",
    status: 0,
    code: "network_error",
  });
}
