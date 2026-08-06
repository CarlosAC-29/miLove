drop index if exists transactions_fixed_recurrence_month_unique;

alter table transactions
  drop column if exists recurrence_source_id;
