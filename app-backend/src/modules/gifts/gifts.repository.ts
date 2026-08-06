import { db } from '../../database/client.js';

export interface DbGift {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  owner_id: string;
  owner_name: string | null;
}

interface UpsertGiftInput {
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
      VALUES ($1, 'Regalos agregados manualmente')
      RETURNING id
    `,
    [userId],
  );

  return created.rows[0]!.id;
}

export const giftsRepository = {
  async listGiftsForUser(userId: string) {
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
      WHERE rs.category = 'gift'
        AND rs.accepted = true
        AND (rs.user_id = $1 OR rs.user_id = (SELECT partner_id FROM user_partners WHERE user_id = $1))
      ORDER BY COALESCE(rs.accepted_at, rs.created_at) DESC
    `;

    const result = await db.query<DbGift>(sql, [userId]);
    return result.rows;
  },

  async createManualGift(userId: string, input: UpsertGiftInput): Promise<DbGift> {
    const contextId = await ensureContextId(userId);
    const result = await db.query<DbGift>(
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
        VALUES ($1, $2, 'gift', $3, $4, true, $5::timestamptz)
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

  async updateGift(
    userId: string,
    giftId: string,
    input: UpsertGiftInput,
  ): Promise<DbGift | null> {
    const result = await db.query<DbGift>(
      `
        UPDATE recommendation_suggestions
        SET
          title = $3,
          message = $4,
          accepted_at = $5::timestamptz
        WHERE id = $1
          AND category = 'gift'
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
      [giftId, userId, input.title, input.description, input.startAt],
    );

    return result.rows[0] ?? null;
  },

  async deleteGift(userId: string, giftId: string): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM recommendation_suggestions
        WHERE id = $1
          AND category = 'gift'
          AND accepted = true
          AND (
            user_id = $2
            OR user_id = (SELECT partner_id FROM user_partners WHERE user_id = $2)
          )
      `,
      [giftId, userId],
    );

    return (result.rowCount ?? 0) > 0;
  },
};
