create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text,
  avatar text,
  provider text not null default 'email' check (provider in ('google', 'apple', 'email')),
  provider_external_id text,
  created_at timestamptz not null default now()
);

create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_user_id on refresh_tokens(user_id);
create index if not exists idx_refresh_tokens_token_hash on refresh_tokens(token_hash);

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  external_member_id text,
  display_name text not null,
  contribution_amount numeric(14, 2) not null default 0,
  role text not null default 'member',
  unique (couple_id, user_id),
  unique (couple_id, external_member_id)
);

create index if not exists idx_couple_members_couple_id on couple_members(couple_id);
create index if not exists idx_couple_members_user_id on couple_members(user_id);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(14, 2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text not null,
  date date not null,
  context text not null check (context in ('personal', 'household')),
  owner_id text not null,
  user_id uuid not null references users(id) on delete cascade,
  couple_id uuid references couples(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_context_date
  on transactions(user_id, context, date desc);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id text not null,
  amount numeric(14, 2) not null,
  spent numeric(14, 2) not null default 0,
  context text not null check (context in ('personal', 'household')),
  user_id uuid not null references users(id) on delete cascade,
  couple_id uuid references couples(id) on delete cascade
);

create index if not exists idx_budgets_user_context on budgets(user_id, context);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  context text not null check (context in ('personal', 'household')),
  deadline date,
  user_id uuid not null references users(id) on delete cascade,
  couple_id uuid references couples(id) on delete cascade
);

create index if not exists idx_goals_user_context on goals(user_id, context);
