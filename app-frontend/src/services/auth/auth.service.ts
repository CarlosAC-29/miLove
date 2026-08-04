import { env } from "@/app/config/env";
import { delay } from "@/shared/lib/delay";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import {
  mapUser,
  type AuthSession,
  type SignInWithEmailInput,
  type SignUpWithEmailInput,
  type UserDto,
} from "@/entities/user/types";
import { MOCK_USER } from "@/entities/user/mock/users.mock";
import { googleAuthService } from "./google.service";
import { appleAuthService } from "./apple.service";
import { sessionStorageService } from "./session.storage";

interface AuthApiResponse {
  user: UserDto;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

function toSession(response: AuthApiResponse): AuthSession {
  return {
    user: mapUser(response.user),
    accessToken: response.accessToken,
    ...(response.refreshToken ? { refreshToken: response.refreshToken } : {}),
    ...(response.expiresAt ? { expiresAt: response.expiresAt } : {}),
  };
}

/**
 * Fachada de autenticación. Es el único punto que conocen los hooks:
 * Componente -> Hook -> authService -> (mock | API REST + JWT).
 */
export const authService = {
  async signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession> {
    if (env.useMocks) {
      await delay(500);
      const dto: UserDto = { ...MOCK_USER, email: input.email };
      const session: AuthSession = { user: mapUser(dto), accessToken: `mock.email.${dto.id}` };
      sessionStorageService.write(session);
      return session;
    }
    const response = await apiClient.post<AuthApiResponse>(API_ROUTES.auth.login, input);
    const session = toSession(response);
    sessionStorageService.write(session);
    return session;
  },

  async signUpWithEmail(input: SignUpWithEmailInput): Promise<AuthSession> {
    if (env.useMocks) {
      await delay(600);
      const dto: UserDto = {
        id: `usr-${Date.now()}`,
        name: input.name,
        email: input.email,
        provider: "email",
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = { user: mapUser(dto), accessToken: `mock.email.${dto.id}` };
      sessionStorageService.write(session);
      return session;
    }
    const response = await apiClient.post<AuthApiResponse>(API_ROUTES.auth.register, input);
    const session = toSession(response);
    sessionStorageService.write(session);
    return session;
  },

  async signInWithGoogle(): Promise<AuthSession> {
    const session = await googleAuthService.signIn();
    sessionStorageService.write(session);
    return session;
  },

  async signInWithApple(): Promise<AuthSession> {
    const session = await appleAuthService.signIn();
    sessionStorageService.write(session);
    return session;
  },

  async signOut(): Promise<void> {
    if (!env.useMocks) {
      const session = sessionStorageService.read();
      await apiClient.post(
        API_ROUTES.auth.logout,
        session?.refreshToken ? { refreshToken: session.refreshToken } : undefined,
        {
        headers: sessionStorageService.authHeader(),
        },
      );
    }
    sessionStorageService.clear();
  },

  /** Restaura la sesión al abrir la app (futuro: validar/refrescar el JWT). */
  restoreSession(): AuthSession | null {
    return sessionStorageService.read();
  },
};
