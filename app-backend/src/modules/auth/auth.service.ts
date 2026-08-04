import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import { hashToken, signAccessToken, signRefreshToken } from "../../shared/utils/token.js";
import { authRepository, type DbUser } from "./auth.repository.js";
import type { AuthSessionDto, UserDto } from "./auth.types.js";

function mapUser(user: DbUser): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? undefined,
    provider: user.provider,
    createdAt: user.created_at.toISOString(),
  };
}

function expiresAtFromSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function createSession(user: DbUser): Promise<AuthSessionDto> {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  const decoded = jwt.decode(accessToken) as { exp?: number } | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : expiresAtFromSeconds(3600);

  const refreshDecoded = jwt.decode(refreshToken) as { exp?: number } | null;
  const refreshExpiry = new Date((refreshDecoded?.exp ?? Math.floor(Date.now() / 1000) + 86400 * 30) * 1000);
  await authRepository.insertRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiry,
  });

  return {
    user: mapUser(user),
    accessToken,
    refreshToken,
    expiresAt,
  };
}

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await authRepository.findUserByEmail(input.email.toLowerCase());
    if (existing) throw new HttpError(409, "Email is already registered.");

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createEmailUser({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
    });
    return createSession(user);
  },

  async login(input: { email: string; password: string }) {
    const user = await authRepository.findUserByEmail(input.email.toLowerCase());
    if (!user || !user.password_hash) throw new HttpError(401, "Invalid credentials.");

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) throw new HttpError(401, "Invalid credentials.");

    return createSession(user);
  },

  async getSession(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new HttpError(404, "User not found.");
    return { user: mapUser(user) };
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new HttpError(401, "Invalid refresh token.");
    }

    const tokenHash = hashToken(refreshToken);
    const tokenRow = await authRepository.findRefreshToken({ userId: payload.sub, tokenHash });
    if (!tokenRow || tokenRow.revoked_at || tokenRow.expires_at < new Date()) {
      throw new HttpError(401, "Refresh token is revoked or expired.");
    }

    await authRepository.revokeRefreshToken(tokenHash);
    const user = await authRepository.findUserById(payload.sub);
    if (!user) throw new HttpError(404, "User not found.");
    return createSession(user);
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    await authRepository.revokeRefreshToken(hashToken(refreshToken));
  },

  async oauthGoogle(idToken: string) {
    const providerExternalId = `google-${idToken.slice(0, 24)}`;
    const email = `google_${providerExternalId}@milove.oauth.local`;
    const name = "Google User";

    let user = await authRepository.findUserByProvider("google", providerExternalId);
    if (!user) {
      user = await authRepository.createSocialUser({
        name,
        email,
        provider: "google",
        providerExternalId,
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      });
    }
    return createSession(user);
  },

  async oauthApple(identityToken: string) {
    const providerExternalId = `apple-${identityToken.slice(0, 24)}`;
    const email = `${providerExternalId}@privaterelay.appleid.com`;
    const name = "Apple User";

    let user = await authRepository.findUserByProvider("apple", providerExternalId);
    if (!user) {
      user = await authRepository.createSocialUser({
        name,
        email,
        provider: "apple",
        providerExternalId,
      });
    }
    return createSession(user);
  },
};
