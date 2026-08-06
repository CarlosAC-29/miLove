import { db } from '../../database/client.js';

export interface DbAppointment {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  owner_id: string;
  owner_name: string | null;
}

interface UpsertAppointmentInput {
  title: string;
  description: string;
  startAt: string;
}

async function ensureContextId(userId: string): Promise<string> {
  const existing = await db.query<{ id: string }>(
    `
      SELECT id
      FROM recommendation_contexts
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }

  const created = await db.query<{ id: string }>(
    `
      INSERT INTO recommendation_contexts (user_id, context)
      VALUES ($1, 'Citas agregadas manualmente')
      RETURNING id
    `,
    [userId],
  );

  return created.rows[0]!.id;
}

export const datesRepository = {
  async listAppointmentsForUser(userId: string) {
    // Fetch accepted recommendations with category 'date' created by the user or their partner
    const sql = `
      SELECT
        rs.id,
        rs.title,
        rs.message AS description,
        COALESCE(rs.accepted_at, rs.created_at) AS "startAt",
        NULL AS "endAt",
        rs.user_id AS owner_id,
        p.name AS owner_name
      FROM recommendation_suggestions rs
      JOIN profiles p ON p.id = rs.user_id
      WHERE rs.category = 'date'
        AND rs.accepted = true
        AND (rs.user_id = $1 OR rs.user_id = (SELECT partner_id FROM user_partners WHERE user_id = $1))
      ORDER BY COALESCE(rs.accepted_at, rs.created_at) DESC
    `;

    const result = await db.query<DbAppointment>(sql, [userId]);
    return result.rows;
  },

  async createManualAppointment(userId: string, input: UpsertAppointmentInput): Promise<DbAppointment> {
    const contextId = await ensureContextId(userId);
    const result = await db.query<DbAppointment>(
      `
        INSERT INTO recommendation_suggestions (
          context_id,
          user_id,
          category,
          title,
          message,
          accepted,
          accepted_at
        )
        VALUES ($1, $2, 'date', $3, $4, true, $5::timestamptz)
        RETURNING
          id,
          title,
          message AS description,
          accepted_at AS "startAt",
          NULL AS "endAt",
          user_id AS owner_id,
          (SELECT name FROM profiles WHERE id = user_id) AS owner_name
      `,
      [contextId, userId, input.title, input.description, input.startAt],
    );
    return result.rows[0]!;
  },

  async updateAppointment(
    userId: string,
    appointmentId: string,
    input: UpsertAppointmentInput,
  ): Promise<DbAppointment | null> {
    const result = await db.query<DbAppointment>(
      `
        UPDATE recommendation_suggestions
        SET
          title = $3,
          message = $4,
          accepted_at = $5::timestamptz
        WHERE id = $1
          AND category = 'date'
          AND accepted = true
          AND (
            user_id = $2
            OR user_id = (SELECT partner_id FROM user_partners WHERE user_id = $2)
          )
        RETURNING
          id,
          title,
          message AS description,
          accepted_at AS "startAt",
          NULL AS "endAt",
          user_id AS owner_id,
          (SELECT name FROM profiles WHERE id = user_id) AS owner_name
      `,
      [appointmentId, userId, input.title, input.description, input.startAt],
    );

    return result.rows[0] ?? null;
  },

  async deleteAppointment(userId: string, appointmentId: string): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM recommendation_suggestions
        WHERE id = $1
          AND category = 'date'
          AND accepted = true
          AND (
            user_id = $2
            OR user_id = (SELECT partner_id FROM user_partners WHERE user_id = $2)
          )
      `,
      [appointmentId, userId],
    );

    return (result.rowCount ?? 0) > 0;
  },
};
