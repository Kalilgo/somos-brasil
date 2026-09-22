-- 0013: defensa — tasa de requests (rate limit) compartida.
-- Las edge functions (login, member-actions y lecturas) usan bump_rate() para
-- contar requets por ventana fija y decidir si dejan pasar o no.

create table public.rate_limits (
  key text primary key,
  bucket bigint not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index idx_rate_limits_bucket on public.rate_limits (bucket);

grant select, insert, update, delete on public.rate_limits to service_role;

-- Vuelve TRUE si el request está dentro del límite (cuenta y compara).
-- Ventana fija: floor(now/window)*window. Limpia buckets viejos (~24h).
create or replace function public.bump_rate(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
volatile
set search_path = public
as $$
declare v_bucket bigint;
declare v_count integer;
begin
  delete from public.rate_limits
  where bucket < (extract(epoch from now()) - 90000)::bigint;

  v_bucket := floor(extract(epoch from now()) / p_window_seconds)::bigint * p_window_seconds;

  insert into public.rate_limits (key, bucket, count)
  values (p_bucket || ':' || v_bucket, v_bucket, 1)
  on conflict (key) do update
    set count = public.rate_limits.count + 1
  returning public.rate_limits.count into v_count;

  return v_count <= p_limit;
end;
$$;

grant execute on function public.bump_rate(text, integer, integer) to service_role;