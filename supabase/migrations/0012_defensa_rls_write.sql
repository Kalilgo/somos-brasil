-- 0012: defensa — RLS de escritura cerrada para anon/authenticated + topes de longitud.
-- La escritura pasa a depender únicamente de las edge functions (service role, bypasea RLS).
-- Los topes evitan bloat de filas con texto gigante.

-- ============ topes de longitud / valores ============
alter table public.users add constraint users_bio_length check (bio is null or length(bio) <= 200);
alter table public.trips add constraint trips_description_length check (description is null or length(description) <= 500);
alter table public.ideas add constraint ideas_description_length check (description is null or length(description) <= 2000);
alter table public.ideas add constraint ideas_link_length check (link is null or length(link) <= 500);
alter table public.ideas add constraint ideas_image_url_length check (image_url is null or length(image_url) <= 500);
alter table public.ideas add constraint ideas_price_cap check (price is null or price < 10000000);
alter table public.itinerary_items add constraint itinerary_notes_length check (notes is null or length(notes) <= 500);

-- ============ RLS read-only para anon/authenticated ============
drop policy if exists users_write_all on public.users;
drop policy if exists trips_write_all on public.trips;
drop policy if exists trip_members_write_all on public.trip_members;
drop policy if exists categories_write_all on public.categories;
drop policy if exists ideas_write_all on public.ideas;
drop policy if exists votes_write_all on public.votes;
drop policy if exists comments_write_all on public.comments;
drop policy if exists itinerary_items_write_all on public.itinerary_items;
drop policy if exists user_badges_write_all on public.user_badges;