-- 0015: endurecimiento — grants fail-closed, RLS en rate_limits, superficie RPC cerrada.
--
-- Contexto: la migración 0002 dejó `grant all on all tables ... to anon`. Eso no era
-- explotable porque no había policies de escritura (0012 las dropeó), pero dejaba la
-- puerta abierta: si mañana alguien agrega una policy permisiva por error, INSERT /
-- UPDATE / DELETE ya están concedidos y el tables pasa a ser escribible por cualquiera
-- con la anon key. Acá se invierte el default: anon/authenticated solo LEEN, y las
-- tablas nuevas nacen sin permisos.
--
-- service_role sigue teniendo todo (bypassea RLS por design: es lo que usan las edge
-- functions, que son el único path de escritura).

-- ============ 1. grants fail-closed ============
-- Primero se cae todo, después se abre de nuevo solo lo necesario.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on
  public.users,
  public.trips,
  public.trip_members,
  public.categories,
  public.ideas,
  public.votes,
  public.comments,
  public.itinerary_items,
  public.badges,
  public.user_badges,
  public.view_user_stats,
  public.view_activity_days,
  public.view_reaction_time
to anon, authenticated;

-- rate_limits y push_subscriptions quedan solo para service_role: son infraestructura
-- interna, no datos de la app. No se las concede a anon.

grant all on all tables in schema public to service_role;

-- ============ 2. defaults fail-closed para objetos futuros ============
-- Sin esto, cada tabla/función nueva que se cree vuelve a estar expuesta a anon hasta
-- que alguien se acuerde de revocarlo. Esto lo revierte por default.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- ============ 3. rate_limits: faltaba RLS ============
-- 0013 creó la tabla y se olvidó del RLS: en el repo, `enable row level security`
-- aparece en push_subscriptions (0014) pero no en rate_limits. Hoy el impacto es
-- bajo porque anon no tiene grant de tabla, pero una tabla de contadores sin RLS es
-- justo el tipo de cosa que se olvida y después se explota.
alter table public.rate_limits enable row level security;
-- Sin policies => RLS niega todo. service_role la saltea por bypass.

-- ============ 4. superficie RPC: fuera de anon ============
-- Postgres concede EXECUTE sobre toda función nueva al rol PUBLIC por default, y
-- anon/authenticated heredan de PUBLIC. Las dos RPCs de stats solo las invocan las
-- edge functions con service_role (el frontend llama a las functions, no al RPC), así
-- que dejarlas ejecutables desde anon solo agranda la superficie: cualquiera con la
-- anon key podía pedir el resumen o el leaderboard de cualquier trip_id.
revoke execute on function public.get_trip_summary(uuid) from public, anon, authenticated;
revoke execute on function public.get_trip_leaderboard(uuid) from public, anon, authenticated;
grant execute on function public.get_trip_summary(uuid) to service_role;
grant execute on function public.get_trip_leaderboard(uuid) to service_role;

-- bump_rate es interna de las edge functions. Mismo criterio.
revoke execute on function public.bump_rate(text, integer, integer) from public, anon, authenticated;
grant execute on function public.bump_rate(text, integer, integer) to service_role;

-- ============ 5. topes de longitud que faltaban ============
-- location se agregó en 0007 sin cota. La edge function la recorta a 200, pero la
-- garantía tiene que estar en la base, no en el código que llama.
alter table public.trip_members
  add constraint trip_members_location_length check (location is null or length(location) <= 200);

-- ============ 6. comentarios ============
-- Las lecturas siguen siendo públicas para anon: es la decisión D1 (ADR-001) y
-- cambiarla exige que Postgres sepa quién llama, lo cual requiere migrar la
-- identidad a Supabase Auth. Ver "Deuda de seguridad conocida" en docs/DEFENSA.md.
-- Lo que sí queda cerrado acá es la escritura, la RPC y el default de exposición.
