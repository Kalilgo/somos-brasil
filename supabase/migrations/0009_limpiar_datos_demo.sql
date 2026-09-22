-- Somos Brasil — 0009: arrancar de cero en producción.
-- La 0004 sembró contenido demo (ideas/votos/comentarios/itinerario/badges) del viaje
-- "Brasil 2026/27". El grupo recién arranca: sin ideas generadas, ranking en 0.
-- Se conservan: trip + integrantes (con sus fechas), usuarios, categorías y badges disponibles.

delete from public.votes
where idea_id in (select id from public.ideas where trip_id = '00000003-0000-4000-8000-000000000001');

delete from public.comments
where idea_id in (select id from public.ideas where trip_id = '00000003-0000-4000-8000-000000000001');

delete from public.itinerary_items
where trip_id = '00000003-0000-4000-8000-000000000001';

delete from public.user_badges;

delete from public.ideas
where trip_id = '00000003-0000-4000-8000-000000000001';