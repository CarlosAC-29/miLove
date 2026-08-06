import { db } from "../../database/client.js";

export const usersRepository = {
  async getById(userId: string) {
    const result = await db.query(
      `select id, name, email, avatar, provider, created_at as "createdAt"
       from profiles where id = $1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  },

  async getPartnerByUserId(userId: string) {
    const result = await db.query(
      `select p.id, p.name, p.email, p.avatar, p.provider, p.created_at as "createdAt"
       from user_partners up
       join profiles p on p.id = up.partner_id
       where up.user_id = $1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  },

  async updateById(userId: string, input: { name: string; avatar: string }) {
    const result = await db.query(
      `update profiles
       set
         name = $2,
         avatar = nullif($3, '')
       where id = $1
       returning id, name, email, avatar, provider, created_at as "createdAt"`,
      [userId, input.name, input.avatar],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  },
};
