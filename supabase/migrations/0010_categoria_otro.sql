-- Somos Brasil — 0010: categoría universal "Otro".
-- Fallback para ideas que no entran en ninguna categoría. Espejo de apps/web/src/lib/data/demo.ts.

insert into public.categories (id, slug, name, emoji, color, sort_order) values
  ('00000001-0000-4000-8000-000000000008', 'otro', 'Otro', '🎲', '#8B8B93', 8)
on conflict (slug) do nothing;