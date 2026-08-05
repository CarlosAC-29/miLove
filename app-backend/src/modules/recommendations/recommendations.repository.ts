import { db } from "../../database/client.js";

export type SuggestionCategory = "date" | "restaurant" | "activity" | "gift" | "trip";

export interface DbRecommendationContext {
  id: string;
  userId: string;
  context: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbRecommendationSuggestion {
  id: string;
  contextId: string;
  userId: string;
  category: SuggestionCategory;
  title: string;
  message: string;
  accepted: boolean;
  acceptedAt: Date | null;
  createdAt: Date;
}

const baseSuggestionSelect = `
  select
    id,
    context_id as "contextId",
    user_id as "userId",
    category,
    title,
    message,
    accepted,
    accepted_at as "acceptedAt",
    created_at as "createdAt"
  from recommendation_suggestions
`;

export const recommendationsRepository = {
  async getContextByUser(userId: string): Promise<DbRecommendationContext | null> {
    const result = await db.query<DbRecommendationContext>(
      `select
        id,
        user_id as "userId",
        context,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from recommendation_contexts
      where user_id = $1
      limit 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async upsertContext(userId: string, context: string): Promise<DbRecommendationContext> {
    const result = await db.query<DbRecommendationContext>(
      `insert into recommendation_contexts (user_id, context)
       values ($1, $2)
       on conflict (user_id) do update set
         context = excluded.context,
         updated_at = now()
       returning
         id,
         user_id as "userId",
         context,
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [userId, context],
    );
    return result.rows[0]!;
  },

  async deleteSuggestionsByContext(contextId: string): Promise<void> {
    await db.query("delete from recommendation_suggestions where context_id = $1", [contextId]);
  },

  async createSuggestions(
    contextId: string,
    userId: string,
    suggestions: Array<{ category: SuggestionCategory; title: string; message: string }>,
  ): Promise<DbRecommendationSuggestion[]> {
    if (suggestions.length === 0) return [];

    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let i = 0; i < suggestions.length; i += 1) {
      const suggestion = suggestions[i]!;
      const offset = i * 5;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
      values.push(contextId, userId, suggestion.category, suggestion.title, suggestion.message);
    }

    const result = await db.query<DbRecommendationSuggestion>(
      `insert into recommendation_suggestions (context_id, user_id, category, title, message)
       values ${placeholders.join(", ")}
       returning
         id,
         context_id as "contextId",
         user_id as "userId",
         category,
         title,
         message,
         accepted,
         accepted_at as "acceptedAt",
         created_at as "createdAt"`,
      values,
    );
    return result.rows;
  },

  async listSuggestions(
    userId: string,
    status: "all" | "accepted" | "pending",
  ): Promise<DbRecommendationSuggestion[]> {
    if (status === "all") {
      const result = await db.query<DbRecommendationSuggestion>(
        `${baseSuggestionSelect}
         where user_id = $1
         order by created_at desc`,
        [userId],
      );
      return result.rows;
    }

    const accepted = status === "accepted";
    const result = await db.query<DbRecommendationSuggestion>(
      `${baseSuggestionSelect}
       where user_id = $1 and accepted = $2
       order by created_at desc`,
      [userId, accepted],
    );
    return result.rows;
  },

  async acceptSuggestions(userId: string, suggestionIds: string[]): Promise<DbRecommendationSuggestion[]> {
    const result = await db.query<DbRecommendationSuggestion>(
      `update recommendation_suggestions
       set accepted = true, accepted_at = now()
       where user_id = $1 and id = any($2::uuid[])
       returning
         id,
         context_id as "contextId",
         user_id as "userId",
         category,
         title,
         message,
         accepted,
         accepted_at as "acceptedAt",
         created_at as "createdAt"`,
      [userId, suggestionIds],
    );
    return result.rows;
  },

  async deleteSuggestions(userId: string, suggestionIds: string[]): Promise<number> {
    const result = await db.query<{ count: string }>(
      `delete from recommendation_suggestions
       where user_id = $1 and id = any($2::uuid[])
       returning id`,
      [userId, suggestionIds],
    );
    return result.rowCount ?? result.rows.length;
  },

  async getSuggestionStats(userId: string): Promise<{ total: number; accepted: number; pending: number }> {
    const result = await db.query<{ total: string; accepted: string; pending: string }>(
      `select
         count(*)::text as total,
         count(*) filter (where accepted = true)::text as accepted,
         count(*) filter (where accepted = false)::text as pending
       from recommendation_suggestions
       where user_id = $1`,
      [userId],
    );
    const row = result.rows[0]!;
    return {
      total: Number(row.total),
      accepted: Number(row.accepted),
      pending: Number(row.pending),
    };
  },
};
