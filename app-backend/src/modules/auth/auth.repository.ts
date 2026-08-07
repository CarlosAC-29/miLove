import { db } from "../../database/client.js";

export interface DbProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: "google" | "apple" | "email";
  provider_external_id: string | null;
  created_at: Date;
}

export const authRepository = {
  async findProfileById(id: string): Promise<DbProfile | null> {
    const result = await db.query<DbProfile>("select * from profiles where id = $1 limit 1", [id]);
    return result.rows[0] ?? null;
  },

  async findProfileByEmail(email: string): Promise<DbProfile | null> {
    const result = await db.query<DbProfile>("select * from profiles where email = $1 limit 1", [
      email,
    ]);
    return result.rows[0] ?? null;
  },

  async findProfileByProvider(
    provider: "google" | "apple",
    providerExternalId: string,
  ): Promise<DbProfile | null> {
    const result = await db.query<DbProfile>(
      "select * from profiles where provider = $1 and provider_external_id = $2 limit 1",
      [provider, providerExternalId],
    );
    return result.rows[0] ?? null;
  },

  async upsertProfile(input: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: "google" | "apple" | "email";
    providerExternalId?: string;
  }): Promise<DbProfile> {
    const result = await db.query<DbProfile>(
      `insert into profiles (id, name, email, avatar, provider, provider_external_id)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         email = excluded.email,
         provider = excluded.provider,
         provider_external_id = excluded.provider_external_id
       returning *`,
      [
        input.id,
        input.name,
        input.email,
        input.avatar ?? null,
        input.provider,
        input.providerExternalId ?? null,
      ],
    );
    return result.rows[0]!;
  },
};
