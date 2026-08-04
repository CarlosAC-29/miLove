create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar text,
  provider text not null default 'email' check (provider in ('google', 'apple', 'email')),
  provider_external_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_provider_external_id on profiles(provider_external_id);

alter table couples drop constraint if exists couples_created_by_fkey;
alter table couples
  add constraint couples_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

alter table couple_members drop constraint if exists couple_members_user_id_fkey;
alter table couple_members
  add constraint couple_members_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

alter table transactions drop constraint if exists transactions_user_id_fkey;
alter table transactions
  add constraint transactions_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

alter table budgets drop constraint if exists budgets_user_id_fkey;
alter table budgets
  add constraint budgets_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

alter table goals drop constraint if exists goals_user_id_fkey;
alter table goals
  add constraint goals_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;
