create table if not exists recommendation_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  context text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recommendation_contexts_user_id
  on recommendation_contexts(user_id);

create table if not exists recommendation_suggestions (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references recommendation_contexts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null check (category in ('date', 'restaurant', 'activity', 'gift', 'trip')),
  title text not null,
  message text not null,
  accepted boolean not null default false,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_recommendation_suggestions_user_id
  on recommendation_suggestions(user_id);

create index if not exists idx_recommendation_suggestions_context_id
  on recommendation_suggestions(context_id);
