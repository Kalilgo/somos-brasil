-- Somos Brasil — 0006: fechas de viaje por integrante.
-- Cada miembro define sus propias fechas de llegada/salida (pueden diferir del rango del viaje).
-- La RLS existente (write_all con with check (true) sobre trip_members) ya cubre estos UPDATEs,
-- por lo que no se agregan policies nuevas.

alter table public.trip_members
  add column arrival_date date,
  add column departure_date date;

alter table public.trip_members
  add constraint trip_members_dates_check
  check (
    arrival_date is null
    or departure_date is null
    or arrival_date <= departure_date
  );

comment on column public.trip_members.arrival_date is 'Día en que este integrante llega al viaje';
comment on column public.trip_members.departure_date is 'Día en que este integrante se va del viaje';

-- ============ seed demo (mismo rango del viaje: 2026-02-10 → 2026-02-24) ============
-- Muestran que cada uno tiene su propia ventana: algunos entran tarde, otros se van antes.
-- GONZA (5555…) aún no define las suyas → queda el estado "sin definir" para la UI.
update public.trip_members set arrival_date = '2026-02-11', departure_date = '2026-02-23' where user_id = '11111111-1111-4111-8111-111111111111';
update public.trip_members set arrival_date = '2026-02-10', departure_date = '2026-02-17' where user_id = '22222222-2222-4222-8222-222222222222';
update public.trip_members set arrival_date = '2026-02-13', departure_date = '2026-02-24' where user_id = '33333333-3333-4333-8333-333333333333';
update public.trip_members set arrival_date = '2026-02-16', departure_date = '2026-02-24' where user_id = '44444444-4444-4444-8444-444444444444';
update public.trip_members set arrival_date = '2026-02-10', departure_date = '2026-02-14' where user_id = '66666666-6666-4666-8666-666666666666';