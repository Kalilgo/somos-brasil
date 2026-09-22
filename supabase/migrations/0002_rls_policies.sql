-- Somos Brasil — 0002: RLS permisiva (decisión D1, docs/plan.md §3).
-- RLS habilitado en todas las tablas con policies read_all/write_all = TRUE.
-- El "usuario actual" es atribución desde el cliente, nunca mecanismo de seguridad.
-- Ver docs/decisions.md (ADR) para la justificación y el camino a RLS robusta.

-- ============ habilitar RLS ============
alter table public.users enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.categories enable row level security;
alter table public.ideas enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- ============ users ============
create policy users_read_all on public.users
  for select to anon, authenticated, service_role using (true);
create policy users_write_all on public.users
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ trips ============
create policy trips_read_all on public.trips
  for select to anon, authenticated, service_role using (true);
create policy trips_write_all on public.trips
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ trip_members ============
create policy trip_members_read_all on public.trip_members
  for select to anon, authenticated, service_role using (true);
create policy trip_members_write_all on public.trip_members
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ categories ============
create policy categories_read_all on public.categories
  for select to anon, authenticated, service_role using (true);
create policy categories_write_all on public.categories
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ ideas ============
create policy ideas_read_all on public.ideas
  for select to anon, authenticated, service_role using (true);
create policy ideas_write_all on public.ideas
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ votes ============
create policy votes_read_all on public.votes
  for select to anon, authenticated, service_role using (true);
create policy votes_write_all on public.votes
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ comments ============
create policy comments_read_all on public.comments
  for select to anon, authenticated, service_role using (true);
create policy comments_write_all on public.comments
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ itinerary_items ============
create policy itinerary_items_read_all on public.itinerary_items
  for select to anon, authenticated, service_role using (true);
create policy itinerary_items_write_all on public.itinerary_items
  for all to anon, authenticated, service_role using (true) with check (true);

-- ============ badges (solo lectura; la escritura corre por la edge function/service) ============
create policy badges_read_all on public.badges
  for select to anon, authenticated, service_role using (true);

-- ============ user_badges (la escritura la hace get-leaderboard idempotente) ============
create policy user_badges_read_all on public.user_badges
  for select to anon, authenticated, service_role using (true);
create policy user_badges_write_all on public.user_badges
  for insert to anon, authenticated, service_role with check (true);

-- ============ grants ============
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;