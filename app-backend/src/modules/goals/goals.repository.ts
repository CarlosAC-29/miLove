import { db } from '../../database/client.js';

export interface DbGoal {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  owner_id: string;
  owner_name: string | null;
}

interface UpsertGoalInput {
  title: string;
  description: string;
}

export const goalsRepository = {
  async listGoalsForUser(userId: string) {
    const sql = `
      SELECT
        sg.id,
        sg.title,
        sg.description,
        sg.created_at AS "startAt",
        sg.user_id AS owner_id,
        p.name AS owner_name
      FROM shared_goals sg
      JOIN profiles p ON p.id = sg.user_id
      WHERE (
        sg.user_id = $1
        OR sg.user_id = (SELECT partner_id FROM user_partners WHERE user_id = $1)
      )
      ORDER BY sg.created_at DESC
    `;

    const result = await db.query<DbGoal>(sql, [userId]);
    return result.rows;
  },

  async createGoal(userId: string, input: UpsertGoalInput): Promise<DbGoal> {
    const result = await db.query<DbGoal>(
      `
        INSERT INTO shared_goals (user_id, title, description)
        VALUES ($1, $2, $3)
        RETURNING
          id,
          title,
          description,
          created_at AS "startAt",
          user_id AS owner_id,
          (SELECT name FROM profiles WHERE id = user_id) AS owner_name
      `,
      [userId, input.title, input.description],
    );
    return result.rows[0]!;
  },

  async updateGoal(
    userId: string,
    goalId: string,
    input: UpsertGoalInput,
  ): Promise<DbGoal | null> {
    const result = await db.query<DbGoal>(
      `
        UPDATE shared_goals
        SET
          title = $3,
          description = $4,
          updated_at = now()
        WHERE id = $1
          AND (
            user_id = $2
            OR user_id = (SELECT partner_id FROM user_partners WHERE user_id = $2)
          )
        RETURNING
          id,
          title,
          description,
          created_at AS "startAt",
          user_id AS owner_id,
          (SELECT name FROM profiles WHERE id = user_id) AS owner_name
      `,
      [goalId, userId, input.title, input.description],
    );

    return result.rows[0] ?? null;
  },

  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM shared_goals
        WHERE id = $1
          AND (
            user_id = $2
            OR user_id = (SELECT partner_id FROM user_partners WHERE user_id = $2)
          )
      `,
      [goalId, userId],
    );

    return (result.rowCount ?? 0) > 0;
  },
};
