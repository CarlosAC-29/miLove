import { db } from '../../database/client.js';

export interface DbWishlistItem {
  id: string;
  title: string;
  description: string | null;
  webUrl: string | null;
  startAt: string;
  owner_id: string;
  owner_name: string | null;
}

interface UpsertWishlistItemInput {
  title: string;
  description: string;
  webUrl: string;
}

export const wishlistRepository = {
  async listItemsForUser(userId: string) {
    const sql = `
      SELECT
        wi.id,
        wi.title,
        wi.description,
        wi.web_url AS "webUrl",
        wi.created_at AS "startAt",
        wi.user_id AS owner_id,
        p.name AS owner_name
      FROM wishlist_items wi
      JOIN profiles p ON p.id = wi.user_id
      WHERE (
        wi.user_id = $1
        OR wi.user_id = (SELECT partner_id FROM user_partners WHERE user_id = $1)
      )
      ORDER BY wi.created_at DESC
    `;

    const result = await db.query<DbWishlistItem>(sql, [userId]);
    return result.rows;
  },

  async createItem(userId: string, input: UpsertWishlistItemInput): Promise<DbWishlistItem> {
    const result = await db.query<DbWishlistItem>(
      `
        INSERT INTO wishlist_items (user_id, title, description, web_url)
        VALUES ($1, $2, $3, nullif($4, ''))
        RETURNING
          id,
          title,
          description,
          web_url AS "webUrl",
          created_at AS "startAt",
          user_id AS owner_id,
          (SELECT name FROM profiles WHERE id = user_id) AS owner_name
      `,
      [userId, input.title, input.description, input.webUrl],
    );
    return result.rows[0]!;
  },

  async updateItem(
    userId: string,
    itemId: string,
    input: UpsertWishlistItemInput,
  ): Promise<DbWishlistItem | null> {
    const result = await db.query<DbWishlistItem>(
      `
        UPDATE wishlist_items
        SET
          title = $3,
          description = $4,
          web_url = nullif($5, ''),
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
          web_url AS "webUrl",
          created_at AS "startAt",
          user_id AS owner_id,
          (SELECT name FROM profiles WHERE id = user_id) AS owner_name
      `,
      [itemId, userId, input.title, input.description, input.webUrl],
    );

    return result.rows[0] ?? null;
  },

  async deleteItem(userId: string, itemId: string): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM wishlist_items
        WHERE id = $1
          AND (
            user_id = $2
            OR user_id = (SELECT partner_id FROM user_partners WHERE user_id = $2)
          )
      `,
      [itemId, userId],
    );

    return (result.rowCount ?? 0) > 0;
  },
};
