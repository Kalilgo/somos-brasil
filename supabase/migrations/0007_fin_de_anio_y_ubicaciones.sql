-- Somos Brasil — 0007: viaje real de fin de año + ubicación por integrante.
-- El grupo viaja del 26/12/2026 al 04/01/2027. Se agrega la columna location a
-- trip_members (la define cada integrante desde la app; la RLS write_all de
-- trip_members ya cubre estos UPDATEs, no se agregan policies nuevas).

alter table public.trip_members
  add column location text;

comment on column public.trip_members.location is 'Dónde va a estar este integrante (ciudad / alojamiento). Lo define cada uno desde la app';

-- ============ viaje demo → pasa a ser el viaje real de fin de año ============
update public.trips
set name = 'Brasil 2026/27: Fin de año',
    description = 'Recife + Olinda para el Reveillon, con un ojo en Salvador. Del 26 de diciembre al 4 de enero.',
    start_date = '2026-12-26',
    end_date = '2027-01-04',
    updated_at = now()
where id = '00000003-0000-4000-8000-000000000001';

-- ============ fechas reales por integrante ============
-- HONGO (Mati): 27 dic → 2 ene
update public.trip_members
set arrival_date = '2026-12-27', departure_date = '2027-01-02'
where user_id = '44444444-4444-4444-8444-444444444444';

-- GONZA: 26 dic → 4 ene
update public.trip_members
set arrival_date = '2026-12-26', departure_date = '2027-01-04'
where user_id = '55555555-5555-4555-8555-555555555555';

-- DOZO: 28 dic → 4 ene
update public.trip_members
set arrival_date = '2026-12-28', departure_date = '2027-01-04'
where user_id = '33333333-3333-4333-8333-333333333333';

-- QUEME, FLOR y KALIL: sin fechas por ahora
update public.trip_members
set arrival_date = null, departure_date = null
where user_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '66666666-6666-4666-8666-666666666666'
);