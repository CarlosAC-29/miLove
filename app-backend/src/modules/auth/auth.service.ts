import { timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { authRepository, type DbProfile } from "./auth.repository.js";
import { supabaseAdmin, supabaseAuth } from "../../infrastructure/supabase/client.js";
import type { AuthSessionDto, UserDto } from "./auth.types.js";

function mapUser(user: DbProfile): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? undefined,
    provider: user.provider,
    createdAt: user.created_at.toISOString(),
  };
}

function toAuthSession(
  user: DbProfile,
  session: { access_token: string; refresh_token: string; expires_in: number },
): AuthSessionDto {
  return {
    user: mapUser(user),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: new Date(Date.now() + session.expires_in * 1000).toISOString(),
  };
}

async function ensureProfile(input: {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "apple" | "email";
  providerExternalId?: string;
}): Promise<DbProfile> {
  return authRepository.upsertProfile(input);
}

function validateRegistrationCode(code: string) {
  const configuredCode = env.REGISTRATION_CODE;
  if (!configuredCode) {
    throw new HttpError(503, "Registration is currently unavailable.");
  }

  const submittedCode = Buffer.from(code);
  const expectedCode = Buffer.from(configuredCode);
  const isValid =
    submittedCode.length === expectedCode.length && timingSafeEqual(submittedCode, expectedCode);
  if (!isValid) {
    throw new HttpError(403, "Invalid registration code.");
  }
}

export const authService = {
  async register(input: { name: string; email: string; password: string; registrationCode: string }) {
    validateRegistrationCode(input.registrationCode);
    const email = input.email.toLowerCase();
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error) {
      throw new HttpError(400, error.message);
    }
    if (!data.user) {
      throw new HttpError(500, "Unable to create user.");
    }

    const profile = await ensureProfile({
      id: data.user.id,
      name: input.name,
      email,
      provider: "email",
    });

    if (data.session) {
      return toAuthSession(profile, data.session);
    }

    const login = await supabaseAuth.auth.signInWithPassword({ email, password: input.password });
    if (login.error || !login.data.session) {
      throw new HttpError(500, login.error?.message ?? "Unable to start session.");
    }
    return toAuthSession(profile, login.data.session);
  },

  async login(input: { email: string; password: string }) {
    const email = input.email.toLowerCase();
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error || !data.user || !data.session) {
      throw new HttpError(401, error?.message ?? "Invalid credentials.");
    }

    const profile = await ensureProfile({
      id: data.user.id,
      name: (data.user.user_metadata["name"] as string | undefined) ?? data.user.email ?? "Usuario",
      email: data.user.email ?? email,
      avatar: data.user.user_metadata["avatar"] as string | undefined,
      provider: (data.user.app_metadata["provider"] as "google" | "apple" | "email") ?? "email",
    });
    return toAuthSession(profile, data.session);
  },

  async getSession(userId: string) {
    const profile = await authRepository.findProfileById(userId);
    if (!profile) throw new HttpError(404, "User not found.");
    return { user: mapUser(profile) };
  },

  async refresh(refreshToken: string) {
    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) {
      throw new HttpError(401, error?.message ?? "Invalid refresh token.");
    }

    const profile = await ensureProfile({
      id: data.user.id,
      name: (data.user.user_metadata["name"] as string | undefined) ?? data.user.email ?? "Usuario",
      email: data.user.email ?? "",
      avatar: data.user.user_metadata["avatar"] as string | undefined,
      provider: (data.user.app_metadata["provider"] as "google" | "apple" | "email") ?? "email",
    });
    return toAuthSession(profile, data.session);
  },

  async logout() {
    return;
  },

  async oauthGoogle(idToken: string) {
    const { data, error } = await supabaseAuth.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error || !data.user || !data.session) {
      throw new HttpError(401, error?.message ?? "Unable to authenticate with Google.");
    }
    const profile = await ensureProfile({
      id: data.user.id,
      name: (data.user.user_metadata["name"] as string | undefined) ?? data.user.email ?? "Google User",
      email: data.user.email ?? "",
      avatar: data.user.user_metadata["avatar_url"] as string | undefined,
      provider: "google",
      providerExternalId: data.user.user_metadata["provider_id"] as string | undefined,
    });
    return toAuthSession(profile, data.session);
  },

  async oauthApple(identityToken: string) {
    const { data, error } = await supabaseAuth.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
    });
    if (error || !data.user || !data.session) {
      throw new HttpError(401, error?.message ?? "Unable to authenticate with Apple.");
    }
    const profile = await ensureProfile({
      id: data.user.id,
      name: (data.user.user_metadata["name"] as string | undefined) ?? data.user.email ?? "Apple User",
      email: data.user.email ?? "",
      avatar: data.user.user_metadata["avatar_url"] as string | undefined,
      provider: "apple",
      providerExternalId: data.user.user_metadata["provider_id"] as string | undefined,
    });
    return toAuthSession(profile, data.session);
  },
};
