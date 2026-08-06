drop index if exists idx_budgets_user_context_month;

alter table budgets
  drop column if exists month;
