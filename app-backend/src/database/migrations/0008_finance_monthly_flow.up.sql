alter table budgets
  add column if not exists month date not null default date_trunc('month', now())::date;

create index if not exists idx_budgets_user_context_month
  on budgets(user_id, context, month desc);
