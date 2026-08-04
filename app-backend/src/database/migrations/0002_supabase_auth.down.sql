alter table goals drop constraint if exists goals_user_id_fkey;
alter table goals
  add constraint goals_user_id_fkey foreign key (user_id) references users(id) on delete cascade;

alter table budgets drop constraint if exists budgets_user_id_fkey;
alter table budgets
  add constraint budgets_user_id_fkey foreign key (user_id) references users(id) on delete cascade;

alter table transactions drop constraint if exists transactions_user_id_fkey;
alter table transactions
  add constraint transactions_user_id_fkey foreign key (user_id) references users(id) on delete cascade;

alter table couple_members drop constraint if exists couple_members_user_id_fkey;
alter table couple_members
  add constraint couple_members_user_id_fkey foreign key (user_id) references users(id) on delete cascade;

alter table couples drop constraint if exists couples_created_by_fkey;
alter table couples
  add constraint couples_created_by_fkey foreign key (created_by) references users(id) on delete set null;

drop index if exists idx_profiles_provider_external_id;
drop index if exists idx_profiles_email;
drop table if exists profiles;
