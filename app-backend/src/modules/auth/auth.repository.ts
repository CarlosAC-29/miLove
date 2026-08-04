import { db } from "../../database/client.js";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  avatar: string | null;
  provider: "google" | "apple" | "email";
  provider_external_id: string | null;
  created_at: Date;
}

export const authRepository = {
  async findUserByEmail(email: string): Promise<DbUser | null> {
    const result = await db.query<DbUser>("select * from users where email = $1 limit 1", [email]);
    return result.rows[0] ?? null;
  },

  async findUserById(id: string): Promise<DbUser | null> {
    const result = await db.query<DbUser>("select * from users where id = $1 limit 1", [id]);
    return result.rows[0] ?? null;
  },

  async findUserByProvider(
    provider: "google" | "apple",
    providerExternalId: string,
  ): Promise<DbUser | null> {
    const result = await db.query<DbUser>(
      "select * from users where provider = $1 and provider_external_id = $2 limit 1",
      [provider, providerExternalId],
    );
    return result.rows[0] ?? null;
  },

  async createEmailUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<DbUser> {
    const result = await db.query<DbUser>(
      `insert into users (name, email, password_hash, provider)
       values ($1, $2, $3, 'email')
       returning *`,
      [input.name, input.email, input.passwordHash],
    );
    return result.rows[0]!;
  },

  async createSocialUser(input: {
    name: string;
    email: string;
    avatar?: string;
    provider: "google" | "apple";
    providerExternalId: string;
  }): Promise<DbUser> {
    const result = await db.query<DbUser>(
      `insert into users (name, email, avatar, provider, provider_external_id)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [input.name, input.email, input.avatar ?? null, input.provider, input.providerExternalId],
    );
    return result.rows[0]!;
  },

  async insertRefreshToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await db.query(
      "insert into refresh_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)",
      [input.userId, input.tokenHash, input.expiresAt],
    );
  },

  async findRefreshToken(input: { userId: string; tokenHash: string }) {
    const result = await db.query<{ id: string; expires_at: Date; revoked_at: Date | null }>(
      `select id, expires_at, revoked_at
       from refresh_tokens
       where user_id = $1 and token_hash = $2
       order by created_at desc
       limit 1`,
      [input.userId, input.tokenHash],
    );
    return result.rows[0] ?? null;
  },

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db.query("update refresh_tokens set revoked_at = now() where token_hash = $1", [tokenHash]);
  },
};
