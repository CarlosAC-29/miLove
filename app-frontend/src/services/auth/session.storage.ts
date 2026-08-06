import type { AuthSession } from "@/entities/user/types";

const STORAGE_KEY = "milove.session";

/**
 * Session persistence. Isolated so future migrations (httpOnly cookies, secure
 * storage, encrypted stores) do not affect UI or feature hooks.
 */
export const sessionStorageService = {
  read(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },
  write(session: AuthSession): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
  isExpired(session: AuthSession): boolean {
    if (!session.expiresAt) return false;
    const expiresAtMs = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return false;
    return expiresAtMs <= Date.now();
  },
  /** Authorization header used by API services once backend JWT is enabled. */
  authHeader(): Record<string, string> {
    const session = this.read();
    return session ? { Authorization: 'Bearer ' + session.accessToken } : {};
  }
};
