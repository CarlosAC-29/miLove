import { db } from '../../database/client.js';

export interface DbPlan {
  id: string;
  category: string;
  title: string;
  description: string | null;
  startAt: string;
  owner_id: string;
  owner_name: string | null;
}

export const plansRepository = {
  async listAcceptedPlansForUser(userId: string) {
    const sql = `
      SELECT
        rs.id,
        rs.category,
        rs.title,
        rs.message AS description,
        COALESCE(rs.accepted_at, rs.created_at) AS "startAt",
        rs.user_id AS owner_id,
        p.name AS owner_name
      FROM recommendation_suggestions rs
      JOIN profiles p ON p.id = rs.user_id
      WHERE rs.accepted = true
        AND (rs.user_id = $1 OR rs.user_id = (SELECT partner_id FROM user_partners WHERE user_id = $1))
      ORDER BY COALESCE(rs.accepted_at, rs.created_at) ASC
    `;

    const result = await db.query<DbPlan>(sql, [userId]);
    return result.rows;
  },
};
