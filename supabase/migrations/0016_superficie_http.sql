-- 0016: cerrar la superficie HTTP de la base.
--
-- La app no usa GraphQL ni Storage (0 usos en el codigo, 0 objetos en las
-- migraciones), pero ambos seguian accesibles por URL con la anon key. Cada
-- endpoint-exposed es una puerta mas que hay que auditar y mantener: GraphQL ademas
-- permite introspeccion, que devuelve el mapa del schema entero.
--
-- Nota sobre por que se cierra por SQL y no solo en el dashboard: el dashboard
-- controla que schemas PostgREST expone, pero el permiso real es USAGE sobre el
-- schema. Revocar el permiso cierra la puerta aunque alguien vuelva a activar la
-- exposicion por error.

-- ============ GraphQL ============
-- 0015 ya le saco a anon las RPC de stats. Esto cierra el segundo camino de
-- lectura: /graphql/v1 y /rest/v1/graphql_public.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'graphql_public') then
    execute 'revoke all on schema graphql_public from anon, authenticated';
    execute 'revoke create on schema graphql_public from anon, authenticated';
    raise notice 'graphql_public: acceso revocado para anon/authenticated';
  else
    raise notice 'graphql_public: no existe, nada que hacer';
  end if;
end
$$;

-- ============ Storage ============
-- Misma logica: el schema storage existe siempre en un proyecto Supabase, y por
-- default authenticated puede listar los buckets y los objetos. La app no lo usa.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute 'revoke all on schema storage from anon, authenticated';
    raise notice 'storage: acceso revocado para anon/authenticated';
  else
    raise notice 'storage: no existe, nada que hacer';
  end if;
end
$$;

-- ============ default fail-closed para schemas nuevos ============
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
