import { sessionStorageService } from "@/services/auth/session.storage";

/**
 * Configuración de entorno tipada.
 *
 * Único lugar donde se leen variables `import.meta.env`. Esto evita que la UI
 * conozca detalles de infraestructura y permite cambiar de mocks a un backend
 * REST real sin tocar componentes.
 */
export interface AppEnv {
  readonly apiBaseUrl: string;
  readonly useMocks: boolean;
  readonly apiTimeoutMs: number;
}

export const env: AppEnv = {
  apiBaseUrl: import.meta.env["VITE_API_BASE_URL"] ?? "/api",
  get useMocks() {
    return (import.meta.env["VITE_USE_MOCKS"] ?? "true") !== "false" || sessionStorageService.isDemo();
  },
  apiTimeoutMs: Number(import.meta.env["VITE_API_TIMEOUT_MS"] ?? 15000)
};
