-- Somos Brasil — 0001: esquema inicial.
-- Datamodel completo en docs/plan.md §2. PK uuid (gen_random_uuid, core desde PG13),
-- fechas timestamptz, naming snake_case, FKs con CASCADE donde el hijo depende del padre.

-- ============ users (seed fijo de 6, sin auth) ============
create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text not null,
  color text not null,
  bio text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint users_name_not_empty check (length(name) > 0)
);

-- ============ trips ============
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  description text,
  currency text not null default 'USD' check (currency in ('USD', 'BRL', 'ARS', 'MXN', 'EUR')),
  start_date date,
  end_date date,
  status text not null default 'planning' check (status in ('planning', 'confirmed', 'done')),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trips_status on public.trips (status);
create index idx_trips_created_by on public.trips (created_by);

-- ============ trip_members (N:M trips <-> users) ============
create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index idx_trip_members_user on public.trip_members (user_id);

-- ============ categories (catálogo fijo de 7, global) ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text not null,
  color text not null,
  sort_order integer not null
);

-- ============ ideas ============
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  user_id uuid not null references public.users (id),
  title text not null check (length(title) between 1 and 120),
  description text,
  link text,
  image_url text,
  price numeric(12, 2) check (price is null or price >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'BRL', 'ARS', 'MXN', 'EUR')),
  status text not null default 'proposal' check (status in ('proposal', 'discussing', 'confirmed', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ideas_trip on public.ideas (trip_id);
create index idx_ideas_trip_category on public.ideas (trip_id, category_id);
create index idx_ideas_trip_status on public.ideas (trip_id, status);
create index idx_ideas_user on public.ideas (user_id);
create index idx_ideas_category on public.ideas (category_id);

-- ============ votes (1 voto por usuario por idea; reactivar idea cambia reacción) ============
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.users (id),
  reaction text not null check (reaction in ('🔥', '❤️', '😐', '🙅')),
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create index idx_votes_user on public.votes (user_id);

-- ============ comments ============
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.users (id),
  body text not null check (length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index idx_comments_idea_created on public.comments (idea_id, created_at);
create index idx_comments_user on public.comments (user_id);

-- ============ itinerary_items (una idea confirmada entra 1 sola vez, D4) ============
create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  idea_id uuid not null unique references public.ideas (id) on delete cascade,
  day_number integer not null check (day_number >= 1),
  sort_order integer not null default 0,
  notes text,
  added_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

create index idx_itinerary_trip_day on public.itinerary_items (trip_id, day_number, sort_order);

-- ============ badges (catálogo fijo) ============
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  emoji text not null,
  color text not null,
  criteria text not null
);

-- ============ user_badges (earned) ============
create table public.user_badges (
  user_id uuid not null references public.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index idx_user_badges_badge on public.user_badges (badge_id);

-- ============ trigger updated_at ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create trigger ideas_set_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();