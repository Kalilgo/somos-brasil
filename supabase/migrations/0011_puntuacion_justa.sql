-- Puntuación justa en el leaderboard:
-- * los votos propios (votarse a uno mismo) no suman
-- * las reacciones recibidas por otros sí suman (además de las dadas)
create or replace function public.get_trip_leaderboard(p_trip_id uuid)
returns table (
  user_id uuid,
  ideas bigint,
  votes bigint,
  comments bigint,
  ideas_confirmed bigint,
  reactions_received bigint,
  categories_touched bigint,
  cheapest_ideas bigint,
  activity_days date[]
)
language sql
stable
set search_path = public
as $$
with cheapest as (
  select i.id, i.user_id
  from public.ideas i
  where i.trip_id = p_trip_id
    and i.price is not null
    and i.price = (
      select min(i2.price)
      from public.ideas i2
      where i2.trip_id = p_trip_id and i2.category_id = i.category_id and i2.price is not null
    )
)
select
  tm.user_id,
  (select count(*) from public.ideas i where i.trip_id = p_trip_id and i.user_id = tm.user_id) as ideas,
  (select count(*) from public.votes v join public.ideas i on i.id = v.idea_id where i.trip_id = p_trip_id and v.user_id = tm.user_id and i.user_id <> tm.user_id) as votes,
  (select count(*) from public.comments c join public.ideas i on i.id = c.idea_id where i.trip_id = p_trip_id and c.user_id = tm.user_id) as comments,
  (select count(*) from public.ideas i where i.trip_id = p_trip_id and i.user_id = tm.user_id and i.status = 'confirmed') as ideas_confirmed,
  (select count(*) from public.votes v join public.ideas i on i.id = v.idea_id where i.trip_id = p_trip_id and i.user_id = tm.user_id and v.user_id <> tm.user_id) as reactions_received,
  (select count(distinct i.category_id) from public.ideas i where i.trip_id = p_trip_id and i.user_id = tm.user_id) as categories_touched,
  (select count(*) from cheapest ch where ch.user_id = tm.user_id) as cheapest_ideas,
  (select array(
     select distinct base.activity_date
     from (
       select (i2.created_at at time zone 'UTC')::date as activity_date
       from public.ideas i2 where i2.user_id = tm.user_id
       union all
       select (v2.created_at at time zone 'UTC')::date as activity_date
       from public.votes v2 where v2.user_id = tm.user_id
       union all
       select (c2.created_at at time zone 'UTC')::date as activity_date
       from public.comments c2 where c2.user_id = tm.user_id
     ) base
     order by 1
   )) as activity_days
from public.trip_members tm
where tm.trip_id = p_trip_id
order by tm.joined_at;
$$;