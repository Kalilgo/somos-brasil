-- Somos Brasil — 0008: get_trip_summary con reparto proporcional a los días de cada integrante.
-- El "por persona" pasa a ser un costo POR DÍA (total / días totales pagantes) y se devuelve la
-- lista de integrantes con sus días presentes, para que el frontend calcule la parte de cada uno
-- (el que está 10 días paga más que el de 7). Quienes no definieron fechas quedan en null y no
-- participan del reparto hasta definir sus días.

create or replace function public.get_trip_summary(p_trip_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
with trip_bounds as (
  select t.start_date, t.end_date
  from public.trips t
  where t.id = p_trip_id
),
member_days as (
  select
    tm.user_id,
    u.name,
    u.emoji,
    u.color,
    u.sort_order,
    tm.arrival_date,
    tm.departure_date,
    case
      when tm.arrival_date is not null and tm.departure_date is not null
        then greatest(
          0,
          least(tm.departure_date, tb.end_date)::date
          - greatest(tm.arrival_date, tb.start_date)::date
          + 1
        )
      else null
    end as days_present
  from public.trip_members tm
  join public.users u on u.id = tm.user_id
  cross join trip_bounds tb
  where tm.trip_id = p_trip_id
),
paydays as (
  select coalesce(sum(md.days_present), 0) as total
  from member_days md
  where md.days_present is not null and md.days_present > 0
)
select jsonb_build_object(
    'totals_per_category', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'category_id', t.category_id,
          'slug', t.slug,
          'name', t.name,
          'emoji', t.emoji,
          'color', t.color,
          'total', t.total,
          'count', t.count
        ) order by t.sort_order)
        from (
          select
            c.id as category_id, c.slug, c.name, c.emoji, c.color, c.sort_order,
            sum(i.price) as total,
            count(i.id) as count
          from public.categories c
          join public.ideas i on i.category_id = c.id
          where i.trip_id = p_trip_id and i.status = 'confirmed'
          group by c.id, c.slug, c.name, c.emoji, c.color, c.sort_order
        ) t
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
          'per_day', case when pd.total > 0 then round(t.total / pd.total::numeric, 2) else null end
        ))
        from (
          select i.currency, sum(i.price) as total
          from public.ideas i
          where i.trip_id = p_trip_id and i.status = 'confirmed' and i.price is not null
          group by i.currency
        ) t
        cross join paydays pd
      ),
      '[]'::jsonb
    ),
    'payer_total_days', (select total from paydays),
    'members', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'user_id', md.user_id,
          'name', md.name,
          'emoji', md.emoji,
          'color', md.color,
          'arrival_date', md.arrival_date,
          'departure_date', md.departure_date,
          'days_present', md.days_present
        ) order by md.sort_order)
        from member_days md
      ),
      '[]'::jsonb
    ),
    'confirmed_count', (select count(*) from public.ideas i where i.trip_id = p_trip_id and i.status = 'confirmed'),
    'member_count', (select count(*) from public.trip_members where trip_id = p_trip_id),
    'trip_currency', (select currency from public.trips where id = p_trip_id)
  )
$$;

grant execute on function public.get_trip_summary(uuid) to anon, authenticated, service_role;