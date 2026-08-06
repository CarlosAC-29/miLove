create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wishlist_items_user_id
  on wishlist_items(user_id);

insert into wishlist_items (user_id, title, description, created_at, updated_at)
select
  rs.user_id,
  rs.title,
  rs.message,
  coalesce(rs.accepted_at, rs.created_at),
  now()
from recommendation_suggestions rs
where rs.accepted = true
  and rs.category = 'gift';

create table if not exists shared_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shared_goals_user_id
  on shared_goals(user_id);

insert into shared_goals (user_id, title, description, created_at, updated_at)
select
  rs.user_id,
  rs.title,
  rs.message,
  coalesce(rs.accepted_at, rs.created_at),
  now()
from recommendation_suggestions rs
where rs.accepted = true
  and rs.category = 'trip';
