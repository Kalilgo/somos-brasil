-- Somos Brasil — 0005: vistas de stats y funciones SQL (backing de las Edge Functions).
-- Documentado en docs/plan.md §2.9/§7. Vistas con security_invoker para que sufran las
-- mismas policies RLS de las tablas base (PG15+). Las funciones exponen el mismo contrato
-- que consume el frontend (apps/web/src/lib/data/supabase.ts).

-- ============ vista: stats globales por usuario ============
create view public.view_user_stats
with (security_invoker = true)
as
select
  u.id as user_id,
  count(distinct i.id) filter (where i.user_id = u.id) as ideas_proposed,
  count(distinct v.id) filter (where v.user_id = u.id) as votes_cast,
  count(distinct c.id) filter (where c.user_id = u.id) as comments_made,
  count(distinct ic.id) filter (where ic.user_id = u.id and ic.status = 'confirmed') as ideas_confirmed
from public.users u
left join public.ideas i on i.user_id = u.id
left join public.votes v on v.user_id = u.id
left join public.comments c on c.user_id = u.id
left join public.ideas ic on ic.user_id = u.id and ic.status = 'confirmed'
group by u.id;

-- ============ vista: días con actividad por usuario ============
create view public.view_activity_days
with (security_invoker = true)
as
select base.user_id, base.activity_date
from (
  select user_id, (created_at at time zone 'UTC')::date as activity_date
  from public.ideas
  union all
  select user_id, (created_at at time zone 'UTC')::date as activity_date
  from public.votes
  union all
  select user_id, (created_at at time zone 'UTC')::date as activity_date
  from public.comments
) base
group by base.user_id, base.activity_date;

-- ============ vista: latencia promedio de voto por usuario ============
create view public.view_reaction_time
with (security_invoker = true)
as
select
  v.user_id,
  round(avg(extract(epoch from (v.created_at - i.created_at)))) as avg_seconds
from public.votes v
join public.ideas i on i.id = v.idea_id
group by v.user_id;

-- ============ función: resumen del trip (contrato TripSummary) ============
create or replace function public.get_trip_summary(p_trip_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
select jsonb_build_object(
    'totals_per_category', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'category_id', c.id,
          'slug', c.slug,
          'name', c.name,
          'emoji', c.emoji,
          'color', c.color,
          'total', sum(i.price),
          'count', count(i.id)
        ) order by c.sort_order)
        from public.categories c
        join public.ideas i on i.category_id = c.id
        where i.trip_id = p_trip_id and i.status = 'confirmed'
        group by c.id, c.slug, c.name, c.emoji, c.color, c.sort_order
      ),
      '[]'::jsonb
    ),
    'totals_per_currency', coalesce(
      (
        select jsonb_agg(jsonb_build_object('currency', t.currency, 'total', t.total))
        from (
          select i.currency, sum(i.price) as total
          from public.ideas i
          where i.trip_id = p_trip_id and i.status = 'confirmed' and i.price is not null
          group by i.currency
        ) t
      ),
      '[]'::jsonb
    ),
    'per_person', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'currency', t.currency,
          'total', t.total,
          'per_member', round(t.total / m.member_count, 2)
        ))
        from (
          select i.currency, sum(i.price) as total
          from public.ideas i
          where i.trip_id = p_trip_id and i.status = 'confirmed' and i.price is not null
          group by i.currency
        ) t
        cross join (
          select nullif(count(*), 0) as member_count
          from public.trip_members
          where trip_id = p_trip_id
        ) m
      ),
      '[]'::jsonb
    ),
    'confirmed_count', (select count(*) from public.ideas i where i.trip_id = p_trip_id and i.status = 'confirmed'),
    'member_count', (select count(*) from public.trip_members where trip_id = p_trip_id),
    'trip_currency', (select currency from public.trips where id = p_trip_id)
  )
$$;

-- ============ función: leaderboard por trip (contrato get-leaderboard) ============
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
  (select count(*) from public.votes v join public.ideas i on i.id = v.idea_id where i.trip_id = p_trip_id and v.user_id = tm.user_id) as votes,
  (select count(*) from public.comments c join public.ideas i on i.id = c.idea_id where i.trip_id = p_trip_id and c.user_id = tm.user_id) as comments,
  (select count(*) from public.ideas i where i.trip_id = p_trip_id and i.user_id = tm.user_id and i.status = 'confirmed') as ideas_confirmed,
  (select count(*) from public.votes v join public.ideas i on i.id = v.idea_id where i.trip_id = p_trip_id and i.user_id = tm.user_id) as reactions_received,
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

-- ============ grants ============
grant select on public.view_user_stats to anon, authenticated, service_role;
grant select on public.view_activity_days to anon, authenticated, service_role;
grant select on public.view_reaction_time to anon, authenticated, service_role;
grant execute on function public.get_trip_summary(uuid) to anon, authenticated, service_role;
grant execute on function public.get_trip_leaderboard(uuid) to anon, authenticated, service_role;