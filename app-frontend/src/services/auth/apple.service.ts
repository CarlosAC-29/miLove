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
 * Proveedor Sign in with Apple. Contempla el email privado de Apple y el
 * identificador único que el proveedor entrega solo la primera vez.
 */
export const appleAuthService = {
  async signIn(): Promise<AuthSession> {
    if (env.useMocks) {
      await delay(600);
      const dto: UserDto = {
        id: "usr-apple-1",
        name: "Carlos Rivera",
        email: "kx9f2m1p8t@privaterelay.appleid.com",
        provider: "apple",
        createdAt: new Date().toISOString(),
      };
      return { user: mapUser(dto), accessToken: `mock.apple.${dto.id}` };
    }

    const identityToken = await requestAppleIdentityToken();
    const response = await apiClient.post<AuthApiResponse>(API_ROUTES.auth.apple, { identityToken });
    return {
      user: mapUser(response.user),
      accessToken: response.accessToken,
      ...(response.refreshToken ? { refreshToken: response.refreshToken } : {}),
      ...(response.expiresAt ? { expiresAt: response.expiresAt } : {}),
    };
  },
};

async function requestAppleIdentityToken(): Promise<string> {
  throw new Error("Sign in with Apple aún no está configurado para este entorno.");
}
