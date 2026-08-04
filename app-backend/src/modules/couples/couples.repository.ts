import { db } from "../../database/client.js";

export const couplesRepository = {
  async create(name: string, createdBy: string) {
    const couple = await db.query(
      "insert into couples (name, created_by) values ($1, $2) returning id, name, created_at as \"createdAt\"",
      [name, createdBy],
    );
    const row = couple.rows[0]!;
    return {
      ...row,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  },

  async addMember(input: {
    coupleId: string;
    userId?: string;
    externalMemberId?: string;
    displayName: string;
    contributionAmount: number;
  }) {
    const result = await db.query(
      `insert into couple_members (couple_id, user_id, external_member_id, display_name, contribution_amount)
       values ($1, $2, $3, $4, $5)
       returning id, couple_id as "coupleId", user_id as "userId", external_member_id as "externalMemberId", display_name as "displayName", contribution_amount as "contributionAmount"`,
      [input.coupleId, input.userId ?? null, input.externalMemberId ?? null, input.displayName, input.contributionAmount],
    );
    const row = result.rows[0]!;
    return {
      ...row,
      contributionAmount: Number(row.contributionAmount),
    };
  },

  async listByUser(userId: string) {
    const result = await db.query(
      `select c.id, c.name, c.created_at as "createdAt"
       from couples c
       join couple_members cm on cm.couple_id = c.id
       where cm.user_id = $1
       order by c.created_at desc`,
      [userId],
    );
    return result.rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
  },
};
