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

  async extendFixedTransactions(userId: string, context: FinanceContext, month: string) {
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
           and is_fixed = true
           and to_char(date, 'YYYY-MM') = $3
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
      [userId, context, month],
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
      `select id, name, target_amount as "targetAmount", current_amount as "currentAmount", context, deadline
       from goals
       where user_id = $1 and context = $2
       order by name asc`,
      [userId, context],
    );
    return result.rows.map((row) => ({
      ...row,
      targetAmount: Number(row.targetAmount),
      currentAmount: Number(row.currentAmount),
      deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : undefined,
    }));
  },

  async createGoal(input: {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    context: FinanceContext;
    deadline?: string;
  }) {
    const result = await db.query(
      `insert into goals (name, target_amount, current_amount, context, deadline, user_id)
       values ($1, $2, $3, $4, $5::date, $6)
       returning id, name, target_amount as "targetAmount", current_amount as "currentAmount", context, deadline`,
      [input.name, input.targetAmount, input.currentAmount, input.context, input.deadline ?? null, input.userId],
    );
    const row = result.rows[0]!;
    return {
      ...row,
      targetAmount: Number(row.targetAmount),
      currentAmount: Number(row.currentAmount),
      deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : undefined,
    };
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
