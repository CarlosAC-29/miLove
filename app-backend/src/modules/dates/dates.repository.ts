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

export const datesRepository = {
  async listAppointmentsForUser(userId: string) {
    const sql = `
      SELECT a.id, a.title, a.description, a.start_at AS "startAt", a.end_at AS "endAt",
             a.owner_id, u.name AS owner_name
      FROM appointments a
      JOIN users u ON u.id = a.owner_id
      WHERE a.owner_id = $1
         OR a.owner_id = (
           SELECT partner_id FROM user_partners WHERE user_id = $1
         )
      ORDER BY a.start_at
    `;
    const result = await db.query<DbAppointment>(sql, [userId]);
    return result.rows;
  },
};
