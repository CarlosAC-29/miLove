import { db } from "../../database/client.js";

export type FinanceContext = "personal" | "household";

export const financeRepository = {
  async listTransactions(userId: string, context: FinanceContext, month?: string) {
    const result = month
      ? await db.query(
        `select id, amount, type, category, is_fixed as "isFixed", description, date, context, owner_id as "ownerId", created_at as "createdAt"
         from transactions
         where user_id = $1
           and context = $2
           and to_char(date, 'YYYY-MM') = $3
         order by date desc, created_at desc`,
        [userId, context, month],
      )
      : await db.query(
      `select id, amount, type, category, is_fixed as "isFixed", description, date, context, owner_id as "ownerId", created_at as "createdAt"
       from transactions
       where user_id = $1 and context = $2
       order by date desc, created_at desc`,
      [userId, context],
    );
    return result.rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
      createdAt: new Date(row.createdAt).toISOString(),
      date: new Date(row.date).toISOString().slice(0, 10),
    }));
  },

  async createTransaction(input: {
    userId: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    isFixed?: boolean;
    description: string;
    date: string;
    context: FinanceContext;
    ownerId: string;
  }) {
    const result = await db.query(
      `insert into transactions (amount, type, category, is_fixed, description, date, context, owner_id, user_id)
       values ($1, $2, $3, $4, $5, $6::date, $7, $8, $9)
       returning id, amount, type, category, is_fixed as "isFixed", description, date, context, owner_id as "ownerId", created_at as "createdAt"`,
      [
        input.amount,
        input.type,
        input.category,
        input.isFixed ?? false,
        input.description,
        input.date,
        input.context,
        input.ownerId,
        input.userId,
      ],
    );
    const row = result.rows[0]!;
    return {
      ...row,
      amount: Number(row.amount),
      createdAt: new Date(row.createdAt).toISOString(),
      date: new Date(row.date).toISOString().slice(0, 10),
    };
  },

  async extendFixedTransactions(
    userId: string,
    context: FinanceContext,
    month: string,
    fixedCategories: readonly string[],
  ) {
    const result = await db.query(
      `with source_transactions as (
         select
           id,
           coalesce(recurrence_source_id, id) as recurrence_source_id,
           amount,
           type,
           category,
           description,
           context,
           owner_id,
           user_id,
           couple_id,
           date
         from transactions
         where user_id = $1
           and context = $2
           and to_char(date, 'YYYY-MM') = $3
           and category = any($4::text[])
       ),
       future_months as (
         select (date_trunc('month', ($3 || '-01')::date) + (month_offset || ' months')::interval)::date as month_start
         from generate_series(1, 3) as month_offset
       )
       insert into transactions (
         amount,
         type,
         category,
         is_fixed,
         description,
         date,
         context,
         owner_id,
         user_id,
         couple_id,
         recurrence_source_id
       )
       select
         source.amount,
         source.type,
         source.category,
         true,
         source.description,
         (
           future.month_start
           + least(
             extract(day from source.date)::integer,
             extract(day from (future.month_start + interval '1 month - 1 day'))::integer
           )
           - 1
         )::date,
         source.context,
         source.owner_id,
         source.user_id,
         source.couple_id,
         source.recurrence_source_id
       from source_transactions source
       cross join future_months future
       on conflict (user_id, recurrence_source_id, date)
         where recurrence_source_id is not null
         do nothing
       returning id`,
      [userId, context, month, fixedCategories],
    );
    return result.rowCount ?? 0;
  },

  async updateTransaction(userId: string, id: string, patch: Record<string, unknown>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const assign = (column: string, value: unknown) => {
      fields.push(`${column} = $${index}`);
      values.push(value);
      index += 1;
    };

    if (patch.amount !== undefined) assign("amount", patch.amount);
    if (patch.type !== undefined) assign("type", patch.type);
    if (patch.category !== undefined) assign("category", patch.category);
    if (patch.isFixed !== undefined) assign("is_fixed", patch.isFixed);
    if (patch.description !== undefined) assign("description", patch.description);
    if (patch.date !== undefined) assign("date", patch.date);
    if (patch.context !== undefined) assign("context", patch.context);
    if (patch.ownerId !== undefined) assign("owner_id", patch.ownerId);

    if (fields.length === 0) {
      const existing = await db.query(
        `select id, amount, type, category, is_fixed as "isFixed", description, date, context, owner_id as "ownerId", created_at as "createdAt"
         from transactions where id = $1 and user_id = $2`,
        [id, userId],
      );
      return existing.rows[0] ?? null;
    }

    values.push(id, userId);
    const result = await db.query(
      `update transactions
       set ${fields.join(", ")}
       where id = $${index} and user_id = $${index + 1}
       returning id, amount, type, category, is_fixed as "isFixed", description, date, context, owner_id as "ownerId", created_at as "createdAt"`,
      values,
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      amount: Number(row.amount),
      createdAt: new Date(row.createdAt).toISOString(),
      date: new Date(row.date).toISOString().slice(0, 10),
    };
  },

  async deleteTransaction(userId: string, id: string) {
    await db.query("delete from transactions where id = $1 and user_id = $2", [id, userId]);
  },

  async listBudgets(userId: string, context: FinanceContext, month?: string) {
    const result = month
      ? await db.query(
        `select
           b.id,
           b.name,
           b.category_id as "categoryId",
           b.amount,
           coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as spent,
           b.context,
           to_char(b.month, 'YYYY-MM') as month
         from budgets b
         left join transactions t
           on t.user_id = b.user_id
           and t.context = b.context
           and t.category = b.category_id
           and to_char(t.date, 'YYYY-MM') = to_char(b.month, 'YYYY-MM')
         where b.user_id = $1 and b.context = $2 and to_char(b.month, 'YYYY-MM') = $3
         group by b.id, b.name, b.category_id, b.amount, b.context, b.month
         order by b.name asc`,
        [userId, context, month],
      )
      : await db.query(
      `select
         b.id,
         b.name,
         b.category_id as "categoryId",
         b.amount,
         coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as spent,
         b.context,
         to_char(b.month, 'YYYY-MM') as month
       from budgets b
       left join transactions t
         on t.user_id = b.user_id
         and t.context = b.context
         and t.category = b.category_id
         and to_char(t.date, 'YYYY-MM') = to_char(b.month, 'YYYY-MM')
       where b.user_id = $1 and b.context = $2
       group by b.id, b.name, b.category_id, b.amount, b.context, b.month
       order by b.month desc, b.name asc`,
      [userId, context],
    );
    return result.rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
      spent: Number(row.spent),
    }));
  },

  async createBudget(input: {
    userId: string;
    name: string;
    categoryId: string;
    amount: number;
    month: string;
    context: FinanceContext;
  }) {
    const result = await db.query(
      `insert into budgets (name, category_id, amount, spent, month, context, user_id)
       values ($1, $2, $3, 0, ($4 || '-01')::date, $5, $6)
       returning id, name, category_id as "categoryId", amount, spent, context, to_char(month, 'YYYY-MM') as month`,
      [input.name, input.categoryId, input.amount, input.month, input.context, input.userId],
    );
    const row = result.rows[0]!;
    return {
      ...row,
      amount: Number(row.amount),
      spent: Number(row.spent),
    };
  },

  async updateBudget(userId: string, id: string, patch: Record<string, unknown>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const assign = (column: string, value: unknown) => {
      fields.push(`${column} = $${index}`);
      values.push(value);
      index += 1;
    };

    if (patch.name !== undefined) assign("name", patch.name);
    if (patch.categoryId !== undefined) assign("category_id", patch.categoryId);
    if (patch.amount !== undefined) assign("amount", patch.amount);
    if (patch.month !== undefined) assign("month", `${patch.month}-01`);
    if (patch.context !== undefined) assign("context", patch.context);

    if (fields.length === 0) {
      const existing = await db.query(
        `select id, name, category_id as "categoryId", amount, spent, context, to_char(month, 'YYYY-MM') as month
         from budgets
         where id = $1 and user_id = $2`,
        [id, userId],
      );
      return existing.rows[0] ?? null;
    }

    values.push(id, userId);
    const result = await db.query(
      `update budgets
       set ${fields.join(", ")}
       where id = $${index} and user_id = $${index + 1}
       returning id, name, category_id as "categoryId", amount, spent, context, to_char(month, 'YYYY-MM') as month`,
      values,
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      amount: Number(row.amount),
      spent: Number(row.spent),
    };
  },

  async deleteBudget(userId: string, id: string) {
    const result = await db.query(
      "delete from budgets where id = $1 and user_id = $2",
      [id, userId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async listGoals(userId: string, context: FinanceContext) {
    const result = await db.query(
      `select g.id, g.name, g.target_amount as "targetAmount",
              (case when g.user_id = $1 or g.is_shared then g.current_amount else 0 end)
                + coalesce(
                  sum(gc.amount) filter (where g.user_id = $1 or g.is_shared or gc.is_shared),
                  0
                ) as "currentAmount",
              g.context, g.deadline, g.is_shared as "isShared", g.user_id = $1 as "isOwner"
       from goals g
       left join goal_contributions gc on gc.goal_id = g.id
       where g.context = $2
         and (
           g.user_id = $1
           or (
             g.is_shared
             and exists (
               select 1
               from couple_members owner_member
               join couple_members viewer_member on viewer_member.couple_id = owner_member.couple_id
               where owner_member.user_id = g.user_id and viewer_member.user_id = $1
             )
           )
           or exists (
             select 1
             from goal_contributions shared_contribution
             join couple_members owner_member on owner_member.user_id = g.user_id
             join couple_members viewer_member on viewer_member.couple_id = owner_member.couple_id
             where shared_contribution.goal_id = g.id
               and shared_contribution.is_shared
               and viewer_member.user_id = $1
           )
         )
       group by g.id
       order by g.name asc`,
      [userId, context],
    );
    const contributionResult = await db.query(
      `select gc.id, gc.goal_id as "goalId", gc.amount, to_char(gc.month, 'YYYY-MM') as month,
              gc.is_shared as "isShared", gc.contributor_id as "contributorId",
              profile.name as "contributorName", gc.contributor_id = $1 as "isOwner"
       from goal_contributions gc
       join goals g on g.id = gc.goal_id
       join profiles profile on profile.id = gc.contributor_id
       where g.context = $2
         and (
           g.user_id = $1
           or (
             (g.is_shared or gc.is_shared)
             and exists (
               select 1
               from couple_members owner_member
               join couple_members viewer_member on viewer_member.couple_id = owner_member.couple_id
               where owner_member.user_id = g.user_id and viewer_member.user_id = $1
             )
           )
         )
       order by gc.month desc, gc.created_at desc`,
      [userId, context],
    );
    const contributionsByGoal = new Map<
      string,
      Array<{
        id: string;
        amount: number;
        month: string;
        isShared: boolean;
        contributorId: string;
        contributorName: string;
        isOwner: boolean;
      }>
    >();
    for (const contribution of contributionResult.rows) {
      const contributions = contributionsByGoal.get(contribution.goalId) ?? [];
      contributions.push({
        id: contribution.id,
        amount: Number(contribution.amount),
        month: contribution.month,
        isShared: contribution.isShared,
        contributorId: contribution.contributorId,
        contributorName: contribution.contributorName,
        isOwner: contribution.isOwner,
      });
      contributionsByGoal.set(contribution.goalId, contributions);
    }
    return result.rows.map((row) => ({
      ...row,
      targetAmount: Number(row.targetAmount),
      currentAmount: Number(row.currentAmount),
      deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : undefined,
      contributions: contributionsByGoal.get(row.id) ?? [],
    }));
  },

  async createGoal(input: {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    context: FinanceContext;
    deadline?: string;
    isShared?: boolean;
    coupleId?: string;
  }) {
    const result = await db.query(
      `insert into goals (
         name,
         target_amount,
         current_amount,
         context,
         deadline,
         is_shared,
         user_id,
         couple_id
       )
       values ($1, $2, $3, $4, $5::date, $6, $7, $8)
       returning id, name, target_amount as "targetAmount", current_amount as "currentAmount", context, deadline,
                 is_shared as "isShared"`,
      [
        input.name,
        input.targetAmount,
        input.currentAmount,
        input.context,
        input.deadline ?? null,
        input.isShared ?? false,
        input.userId,
        input.coupleId ?? null,
      ],
    );
    const row = result.rows[0]!;
    return {
      ...row,
      targetAmount: Number(row.targetAmount),
      currentAmount: Number(row.currentAmount),
      deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : undefined,
    };
  },

  async ensureCoupleIdForPartner(userId: string) {
    const result = await db.query<{ coupleId: string }>(
      `with partner as (
         select partner_id
         from user_partners
         where user_id = $1
       ),
       existing_couple as (
         select own_member.couple_id
         from couple_members own_member
         join partner on true
         where own_member.user_id = $1
           and exists (
             select 1
             from couple_members partner_member
             where partner_member.couple_id = own_member.couple_id
               and partner_member.user_id = partner.partner_id
           )
         order by own_member.id
         limit 1
       ),
       new_couple as (
         insert into couples (name, created_by)
         select 'Finanzas compartidas', $1
         from partner
         where not exists (select 1 from existing_couple)
         returning id
       ),
       selected_couple as (
         select couple_id as id from existing_couple
         union all
         select id from new_couple
       ),
       add_owner as (
         insert into couple_members (
           couple_id,
           user_id,
           display_name,
           contribution_amount
         )
         select selected_couple.id, profile.id, profile.name, 0
         from selected_couple
         join profiles profile on profile.id = $1
         on conflict (couple_id, user_id) do nothing
       ),
       add_partner as (
         insert into couple_members (
           couple_id,
           user_id,
           display_name,
           contribution_amount
         )
         select selected_couple.id, profile.id, profile.name, 0
         from selected_couple
         join partner on true
         join profiles profile on profile.id = partner.partner_id
         on conflict (couple_id, user_id) do nothing
       )
       select id as "coupleId"
       from selected_couple
       limit 1`,
      [userId],
    );
    return result.rows[0]?.coupleId ?? null;
  },

  async createGoalContribution(
    userId: string,
    goalId: string,
    input: { amount: number; month: string; isShared?: boolean },
  ) {
    const result = await db.query(
      `insert into goal_contributions (goal_id, amount, month, is_shared, contributor_id)
       select g.id, $3, $4::date, g.is_shared or $5, $2
       from goals g
       where g.id = $1
         and (
           g.user_id = $2
           or (
             g.is_shared
             and g.couple_id in (
               select couple_id from couple_members where user_id = $2
             )
           )
         )
       returning id`,
      [goalId, userId, input.amount, `${input.month}-01`, input.isShared ?? false],
    );
    return result.rows.length > 0;
  },

  async updateGoal(
    userId: string,
    goalId: string,
    patch: { name?: string; targetAmount?: number; deadline?: string | null; isShared?: boolean },
  ) {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (patch.name !== undefined) {
      values.push(patch.name);
      fields.push(`name = $${values.length}`);
    }
    if (patch.targetAmount !== undefined) {
      values.push(patch.targetAmount);
      fields.push(`target_amount = $${values.length}`);
    }
    if (patch.deadline !== undefined) {
      values.push(patch.deadline);
      fields.push(`deadline = $${values.length}::date`);
    }
    if (patch.isShared !== undefined) {
      values.push(patch.isShared);
      fields.push(`is_shared = $${values.length}`);
    }
    if (fields.length === 0) return null;

    values.push(goalId, userId);
    const result = await db.query(
      `update goals
       set ${fields.join(", ")}
       where id = $${values.length - 1} and user_id = $${values.length}
       returning id, name, target_amount as "targetAmount", current_amount as "currentAmount", context, deadline,
                 is_shared as "isShared"`,
      values,
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      targetAmount: Number(row.targetAmount),
      currentAmount: Number(row.currentAmount),
      deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : undefined,
    };
  },

  async deleteGoal(userId: string, goalId: string) {
    const result = await db.query("delete from goals where id = $1 and user_id = $2", [goalId, userId]);
    return (result.rowCount ?? 0) > 0;
  },

  async updateGoalContribution(
    userId: string,
    goalId: string,
    contributionId: string,
    input: { amount: number; month: string; isShared?: boolean },
  ) {
    const result = await db.query(
      `update goal_contributions gc
       set amount = $4, month = $5::date, is_shared = $6
       from goals g
       where gc.id = $1
         and gc.goal_id = g.id
         and g.id = $2
         and gc.contributor_id = $3
       returning gc.id`,
      [contributionId, goalId, userId, input.amount, `${input.month}-01`, input.isShared ?? false],
    );
    return result.rows.length > 0;
  },

  async deleteGoalContribution(userId: string, goalId: string, contributionId: string) {
    const result = await db.query(
      `delete from goal_contributions gc
       using goals g
       where gc.id = $1
         and gc.goal_id = g.id
         and g.id = $2
         and gc.contributor_id = $3
       returning gc.id`,
      [contributionId, goalId, userId],
    );
    return result.rows.length > 0;
  },

  async listHouseholdMembers(userId: string) {
    const result = await db.query(
      `select cm.id as "memberId", cm.user_id as "userId", cm.display_name as "memberName", cm.contribution_amount as amount, c.id as "householdId", c.name as "householdName"
       from couple_members cm
       join couples c on c.id = cm.couple_id
       where cm.couple_id in (
         select couple_id from couple_members where user_id = $1
       )
       order by cm.display_name asc`,
      [userId],
    );
    return result.rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    }));
  },

  async updateContribution(memberId: string, amount: number) {
    await db.query("update couple_members set contribution_amount = $1 where id = $2", [amount, memberId]);
  },
};
