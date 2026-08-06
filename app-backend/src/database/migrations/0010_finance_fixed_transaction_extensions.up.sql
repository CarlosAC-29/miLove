alter table transactions
  add column if not exists recurrence_source_id uuid references transactions(id) on delete cascade;

create unique index if not exists transactions_fixed_recurrence_month_unique
  on transactions (user_id, recurrence_source_id, date)
  where recurrence_source_id is not null;
