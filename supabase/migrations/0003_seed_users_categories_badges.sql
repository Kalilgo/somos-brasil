-- Somos Brasil — 0003: seed de usuarios fijos (6), categorías (7) y badges.
-- Definición fuente: apps/web/src/lib/data/demo.ts. Ids fijos para referenciarlos desde otros seeds/tests.

-- ============ users ============
insert into public.users (id, name, emoji, color, bio, sort_order) values
  ('11111111-1111-4111-8111-111111111111', 'QUEME', '🔥', '#FF5A5F', 'El que siempre cierra la salida', 1),
  ('22222222-2222-4222-8222-222222222222', 'FLOR', '🌺', '#FF4D6D', 'Planifica todo y nunca viaja liviano', 2),
  ('33333333-3333-4333-8333-333333333333', 'DOZO', '🦖', '#7C3AED', 'Vive el viaje, duerme en el aeropuerto', 3),
  ('44444444-4444-4444-8444-444444444444', 'HONGO', '🍄', '#10B981', 'El que encuentra los precios más raros', 4),
  ('55555555-5555-4555-8555-555555555555', 'GONZA', '⚽', '#F59E0B', 'Delega todo, discute todo', 5),
  ('66666666-6666-4666-8666-666666666666', 'KALIL', '🐪', '#0EA5E9', 'El DJ oficial del grupo', 6)
on conflict (name) do nothing;

-- ============ categories ============
insert into public.categories (id, slug, name, emoji, color, sort_order) values
  ('00000001-0000-4000-8000-000000000001', 'destino', 'Destino', '🏝️', '#FF9F1C', 1),
  ('00000001-0000-4000-8000-000000000002', 'alojamiento', 'Alojamiento', '🛏️', '#7C3AED', 2),
  ('00000001-0000-4000-8000-000000000003', 'transporte', 'Transporte', '✈️', '#2E86DE', 3),
  ('00000001-0000-4000-8000-000000000004', 'lugares', 'Lugares para visitar', '🏖️', '#00A878', 4),
  ('00000001-0000-4000-8000-000000000005', 'comida', 'Comida y bares', '🍹', '#FF4D6D', 5),
  ('00000001-0000-4000-8000-000000000006', 'actividades', 'Actividades', '🎸', '#FF5A5F', 6),
  ('00000001-0000-4000-8000-000000000007', 'extras', 'Gastos varios', '🎒', '#6F5F57', 7)
on conflict (slug) do nothing;

-- ============ badges ============
insert into public.badges (id, key, name, description, emoji, color, criteria) values
  ('00000002-0000-4000-8000-000000000001', 'explorador', 'Explorador',
   'Propusiste ideas en 4+ categorías', '🧭', '#10B981', 'Ideas en ≥4 categorías distintas'),
  ('00000002-0000-4000-8000-000000000002', 'cazador', 'Cazador de ofertas',
   '3 ideas con el precio más bajo de su categoría', '💸', '#FF9F1C', '≥3 ideas más baratas de su categoría'),
  ('00000002-0000-4000-8000-000000000003', 'turbina', 'Turbina',
   'Votaste 5+ veces', '⚡', '#FF5A5F', '≥5 votos'),
  ('00000002-0000-4000-8000-000000000004', 'impulsor', 'Impulsor',
   '3+ ideas tuyas confirmadas', '🚀', '#2E86DE', '≥3 ideas confirmadas'),
  ('00000002-0000-4000-8000-000000000005', 'radio', 'Radio',
   'Comentaste 5+ veces', '📻', '#7C3AED', '≥5 comentarios')
on conflict (key) do nothing;