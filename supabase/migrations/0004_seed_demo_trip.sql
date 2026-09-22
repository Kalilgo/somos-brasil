-- Somos Brasil — 0004: seed del viaje demo "Brasil 2026: Carnaval".
-- Espejo exacto del seed de apps/web/src/lib/data/demo.ts (mismos títulos, precios y estados).
-- created_at relativos a now() para que racha y leaderboard se vean vivos.

-- ============ trip ============
insert into public.trips (id, name, description, currency, start_date, end_date, status, created_by, created_at, updated_at)
values (
  '00000003-0000-4000-8000-000000000001',
  'Brasil 2026: Carnaval',
  'Gran candidato: Recife + Olinda en carnaval, con un ojo en Salvador. Fechas tentativas para Febrero.',
  'USD',
  '2026-02-10',
  '2026-02-24',
  'planning',
  '11111111-1111-4111-8111-111111111111',
  now() - interval '96 hours',
  now() - interval '3 hours'
)
on conflict (id) do nothing;

-- ============ members ============
insert into public.trip_members (trip_id, user_id, joined_at)
select '00000003-0000-4000-8000-000000000001', id, now() - interval '96 hours'
from public.users
on conflict (trip_id, user_id) do nothing;

-- ============ ideas ============
insert into public.ideas
  (id, trip_id, category_id, user_id, title, description, link, image_url, price, currency, status, created_at, updated_at)
values
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444',
   'Recife + Olinda: el carnaval de verdad', 'El carnaval más popular del país, sin turistada. Bloque de frevo hasta las 5am.',
   'https://example.com/olinda-carnaval', null, null, 'USD', 'confirmed', now() - interval '72 hours', now() - interval '3 hours'),
  ('00000004-0000-4000-8000-000000000002', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555',
   'Río de Janeiro (el clásico)', 'Copacabana, Cristo y playa. Más turístico pero nunca falla.',
   null, null, 2400, 'USD', 'discussing', now() - interval '70 hours', now() - interval '20 hours'),
  ('00000004-0000-4000-8000-000000000003', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'Salvador de Bahía', 'Axé y realidad. Vuela el presupuesto pero el carnaval es épico.',
   null, null, 2100, 'USD', 'proposal', now() - interval '68 hours', now() - interval '68 hours'),
  ('00000004-0000-4000-8000-000000000004', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000002', '55555555-5555-4555-8555-555555555555',
   'Airbnb en Olinda frente al mar', 'Casa para 8 con pileta. Cierra 45usd/noche por cabeza.',
   'https://example.com/olinda-airbnb', null, 360, 'USD', 'confirmed', now() - interval '60 hours', now() - interval '2 hours'),
  ('00000004-0000-4000-8000-000000000005', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333',
   'Pousada dos Sonhos', 'Hostel con onda, más barato. No le pidamos pileta.',
   null, null, 28, 'USD', 'proposal', now() - interval '55 hours', now() - interval '55 hours'),
  ('00000004-0000-4000-8000-000000000006', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Hotel en Boa Viagem (Recife)', 'Solo para los días de Recife. Buena playa urbana.',
   null, null, 65, 'USD', 'proposal', now() - interval '50 hours', now() - interval '50 hours'),
  ('00000004-0000-4000-8000-000000000007', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000003', '66666666-6666-4666-8666-666666666666',
   'Vuelo ida y vuelta EZE → REC', 'Directo, maleta despachada. Conseguió precio de cabotaje.',
   'https://example.com/flight-search', null, 860, 'USD', 'confirmed', now() - interval '48 hours', now() - interval '1 hour'),
  ('00000004-0000-4000-8000-000000000008', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444',
   'Alquilar auto por 5 días', 'Para bajadas a Porto de Galinhas. Repartimos costo.',
   null, null, 320, 'USD', 'confirmed', now() - interval '45 hours', now() - interval '5 hours'),
  ('00000004-0000-4000-8000-000000000009', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000003', '55555555-5555-4555-8555-555555555555',
   'Bus nocturno Recife → Salvador', 'Ahorras una noche de hotel. Nadie duerme, misión imposible.',
   null, null, 55, 'USD', 'proposal', now() - interval '40 hours', now() - interval '40 hours'),
  ('00000004-0000-4000-8000-000000000010', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222',
   'Marco Zero + muñeco de frevo', 'El corazon de Recife Antigo. Gratis y obligatorio.',
   null, null, 0, 'USD', 'confirmed', now() - interval '36 hours', now() - interval '36 hours'),
  ('00000004-0000-4000-8000-000000000011', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333',
   'Praia de Boa Viagem', 'Playón urbano con la mejor brisa. Ojo con la marea.',
   null, null, 0, 'USD', 'confirmed', now() - interval '34 hours', now() - interval '34 hours'),
  ('00000004-0000-4000-8000-000000000012', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
   'Olinda: casco histórico', 'Cuestas, colores y frevo callejero con los bloques.',
   null, null, 0, 'USD', 'discussing', now() - interval '32 hours', now() - interval '32 hours'),
  ('00000004-0000-4000-8000-000000000013', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222',
   'Almuerzo en el Mercado de São José', 'Todo fresco, precio de local.',
   null, null, 12, 'BRL', 'confirmed', now() - interval '28 hours', now() - interval '28 hours'),
  ('00000004-0000-4000-8000-000000000014', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000005', '44444444-4444-4444-8444-444444444444',
   'Bodega de carne en Boa Viagem', 'Picanha que no se olvida. Caro pero el recuerdo no tiene precio.',
   null, null, 8, 'USD', 'proposal', now() - interval '26 hours', now() - interval '26 hours'),
  ('00000004-0000-4000-8000-000000000015', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000005', '66666666-6666-4666-8666-666666666666',
   'Acarajé en Salvador', 'Desayuno/merienda santo. Tapatapa en la calle.',
   null, null, 5, 'BRL', 'proposal', now() - interval '24 hours', now() - interval '24 hours'),
  ('00000004-0000-4000-8000-000000000016', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000006', '66666666-6666-4666-8666-666666666666',
   'Clase de forró', '2 horas con bailarina local. Medio grupo se engancha devuelta.',
   null, null, 20, 'USD', 'confirmed', now() - interval '22 hours', now() - interval '22 hours'),
  ('00000004-0000-4000-8000-000000000017', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
   'Buceo en Porto de Galinhas', 'Piscinas naturales con tiburones de arrecife. Incluye equipo y guía.',
   null, null, 95, 'USD', 'discussing', now() - interval '18 hours', now() - interval '18 hours'),
  ('00000004-0000-4000-8000-000000000018', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333',
   'Salir con una escuela de frevo', 'Dónde duerme una escuela local una noche de carnaval. Bestia.',
   null, null, 30, 'USD', 'proposal', now() - interval '16 hours', now() - interval '16 hours'),
  ('00000004-0000-4000-8000-000000000019', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000007', '44444444-4444-4444-8444-444444444444',
   'Seguro de viaje (14 días)', 'Cobertura completa, imprescindible para andar tranquilos.',
   'https://example.com/insurance', null, 60, 'USD', 'confirmed', now() - interval '12 hours', now() - interval '12 hours'),
  ('00000004-0000-4000-8000-000000000020', '00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111',
   'eSIM con datos (15GB)', 'Junto al eSIM de cada uno para no depender del wifi.',
   null, null, 25, 'USD', 'proposal', now() - interval '10 hours', now() - interval '10 hours')
on conflict (id) do nothing;

-- ============ votes ============
insert into public.votes (id, idea_id, user_id, reaction, created_at) values
  ('00000006-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '🔥', now() - interval '2 hours'),
  ('00000006-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '🔥', now() - interval '2 hours'),
  ('00000006-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', '😐', now() - interval '2 hours'),
  ('00000006-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '🔥', now() - interval '20 hours'),
  ('00000006-0000-4000-8000-000000000005', '00000004-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', '🙅', now() - interval '20 hours'),
  ('00000006-0000-4000-8000-000000000006', '00000004-0000-4000-8000-000000000004', '66666666-6666-4666-8666-666666666666', '❤️', now() - interval '1 hour'),
  ('00000006-0000-4000-8000-000000000007', '00000004-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', '❤️', now() - interval '1 hour'),
  ('00000006-0000-4000-8000-000000000008', '00000004-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', '🔥', now() - interval '1 hour'),
  ('00000006-0000-4000-8000-000000000009', '00000004-0000-4000-8000-000000000005', '55555555-5555-4555-8555-555555555555', '🔥', now() - interval '6 hours'),
  ('00000006-0000-4000-8000-000000000010', '00000004-0000-4000-8000-000000000005', '44444444-4444-4444-8444-444444444444', '🔥', now() - interval '6 hours'),
  ('00000006-0000-4000-8000-000000000011', '00000004-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', '🙅', now() - interval '6 hours'),
  ('00000006-0000-4000-8000-000000000012', '00000004-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', '🔥', now() - interval '1 hour'),
  ('00000006-0000-4000-8000-000000000013', '00000004-0000-4000-8000-000000000007', '66666666-6666-4666-8666-666666666666', '🔥', now() - interval '1 hour'),
  ('00000006-0000-4000-8000-000000000014', '00000004-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', '❤️', now() - interval '1 hour'),
  ('00000006-0000-4000-8000-000000000015', '00000004-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', '🔥', now() - interval '4 hours'),
  ('00000006-0000-4000-8000-000000000016', '00000004-0000-4000-8000-000000000008', '66666666-6666-4666-8666-666666666666', '🔥', now() - interval '4 hours'),
  ('00000006-0000-4000-8000-000000000017', '00000004-0000-4000-8000-000000000017', '55555555-5555-4555-8555-555555555555', '❤️', now() - interval '8 hours'),
  ('00000006-0000-4000-8000-000000000018', '00000004-0000-4000-8000-000000000017', '66666666-6666-4666-8666-666666666666', '❤️', now() - interval '8 hours'),
  ('00000006-0000-4000-8000-000000000019', '00000004-0000-4000-8000-000000000017', '22222222-2222-4222-8222-222222222222', '😐', now() - interval '8 hours'),
  ('00000006-0000-4000-8000-000000000020', '00000004-0000-4000-8000-000000000016', '11111111-1111-4111-8111-111111111111', '😐', now() - interval '5 hours'),
  ('00000006-0000-4000-8000-000000000021', '00000004-0000-4000-8000-000000000016', '55555555-5555-4555-8555-555555555555', '🔥', now() - interval '5 hours'),
  ('00000006-0000-4000-8000-000000000022', '00000004-0000-4000-8000-000000000015', '22222222-2222-4222-8222-222222222222', '🔥', now() - interval '7 hours'),
  ('00000006-0000-4000-8000-000000000023', '00000004-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', '🔥', now() - interval '3 hours'),
  ('00000006-0000-4000-8000-000000000024', '00000004-0000-4000-8000-000000000013', '33333333-3333-4333-8333-333333333333', '❤️', now() - interval '3 hours'),
  ('00000006-0000-4000-8000-000000000025', '00000004-0000-4000-8000-000000000020', '44444444-4444-4444-8444-444444444444', '🔥', now() - interval '2 hours')
on conflict (id) do nothing;

-- ============ comments ============
insert into public.comments (id, idea_id, user_id, body, created_at) values
  ('00000007-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '¿Cuántas noches? Si es solo Olinda la hacemos de 10', now() - interval '1 hour'),
  ('00000007-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000004', '55555555-5555-4555-8555-555555555555', '6 noches y después Recife/hostel', now() - interval '1 hour'),
  ('00000007-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', '¿Pero y la playa? Recife tiene buena playa urbana', now() - interval '2 hours'),
  ('00000007-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000017', '33333333-3333-4333-8333-333333333333', 'Tiburoncitos de arrecife no muerden, confíen 🙏', now() - interval '8 hours'),
  ('00000007-0000-4000-8000-000000000005', '00000004-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 'Ese precio es un robo, lo cerramos ya', now() - interval '1 hour'),
  ('00000007-0000-4000-8000-000000000006', '00000004-0000-4000-8000-000000000003', '66666666-6666-4666-8666-666666666666', 'El axé me tienta, pero el presupuesto no', now() - interval '9 hours'),
  ('00000007-0000-4000-8000-000000000007', '00000004-0000-4000-8000-000000000005', '44444444-4444-4444-8444-444444444444', 'Yo diría que reservamos como backup si se cae el Airbnb', now() - interval '6 hours')
on conflict (id) do nothing;

-- ============ itinerary_items ============
insert into public.itinerary_items (id, trip_id, idea_id, day_number, sort_order, notes, added_by, created_at) values
  ('00000005-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000007', 1, 1, 'Llegada temprano, a no perder la tarde', '66666666-6666-4666-8666-666666666666', now() - interval '3 hours'),
  ('00000005-0000-4000-8000-000000000002', '00000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000004', 1, 2, 'Check-in, patear lo que queda del día', '22222222-2222-4222-8222-222222222222', now() - interval '3 hours'),
  ('00000005-0000-4000-8000-000000000003', '00000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000010', 2, 1, null, '22222222-2222-4222-8222-222222222222', now() - interval '3 hours'),
  ('00000005-0000-4000-8000-000000000004', '00000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000013', 2, 2, 'Almorzar barato y rico', '22222222-2222-4222-8222-222222222222', now() - interval '3 hours'),
  ('00000005-0000-4000-8000-000000000005', '00000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000011', 3, 1, null, '33333333-3333-4333-8333-333333333333', now() - interval '3 hours'),
  ('00000005-0000-4000-8000-000000000006', '00000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000016', 3, 2, null, '66666666-6666-4666-8666-666666666666', now() - interval '3 hours')
on conflict (id) do nothing;

-- ============ badges ya ganadas (HONGO → Cazador de ofertas) ============
insert into public.user_badges (user_id, badge_id, earned_at) values
  ('44444444-4444-4444-8444-444444444444', '00000002-0000-4000-8000-000000000002', now() - interval '30 hours')
on conflict (user_id, badge_id) do nothing;