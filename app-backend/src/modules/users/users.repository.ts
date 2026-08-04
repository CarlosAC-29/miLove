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
};
