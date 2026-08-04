import { env } from "@/app/config/env";
import { delay } from "@/shared/lib/delay";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { mapUser, type AuthSession, type UserDto } from "@/entities/user/types";

interface AuthApiResponse {
  user: UserDto;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

/**
 * Proveedor Google OAuth. Hoy simula el round-trip de consentimiento; mañana
 * intercambia el `idToken` de Google por una sesión propia en el backend.
 */
export const googleAuthService = {
  async signIn(): Promise<AuthSession> {
    if (env.useMocks) {
      await delay(600);
      const dto: UserDto = {
        id: "usr-google-1",
        name: "Carlos Rivera",
        email: "carlos.rivera@gmail.com",
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        provider: "google",
        createdAt: new Date().toISOString(),
      };
      return { user: mapUser(dto), accessToken: `mock.google.${dto.id}` };
    }

    // Futuro: obtener el idToken con Google Identity Services y canjearlo.
    const idToken = await requestGoogleIdToken();
    const response = await apiClient.post<AuthApiResponse>(API_ROUTES.auth.google, { idToken });
    return {
      user: mapUser(response.user),
      accessToken: response.accessToken,
      ...(response.refreshToken ? { refreshToken: response.refreshToken } : {}),
      ...(response.expiresAt ? { expiresAt: response.expiresAt } : {}),
    };
  },
};

async function requestGoogleIdToken(): Promise<string> {
  throw new Error("Google Identity Services aún no está configurado para este entorno.");
}
