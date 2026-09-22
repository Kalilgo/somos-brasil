# Somos Brasil ✈️🇧🇷

Planificación de viaje en grupo para 6 amigos: ideas, votos, comentarios, itinerario, resumen de costos y ranking con badges.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + Motion (en `apps/web`)
- **Backend**: Supabase (Postgres + Edge Functions) en `supabase/`
- **Monorepo**: npm workspaces

## Run local (modo demo)

```bash
npm install
npm run dev
```

Sin credenciales de Supabase la app arranca en **modo demo**: datos de ejemplo en memoria
(todos los cambios viven en localStorage). Para usar el backend real:

1. Creá un proyecto en Supabase y aplicá las migraciones de `supabase/migrations/` (via `supabase db push` o la consola).
2. Desplegá las edge functions: `supabase functions deploy` (son públicas, `verify_jwt = false`).
3. Copiá `apps/web/.env.example` a `apps/web/.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la publishable key de proyectos nuevos también funciona como `ANON_KEY`).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Vite dev server (puerto 5173) |
| `npm run build` | Build de producción |
| `npm run typecheck` | tsc sin emitir |
| `npm run lint` | oxlint |

## Usuarios

No hay sistema de auth. Los 6 integrantes existen por seed y se eligen desde el selector de
usuario en `/`; el usuario activo se guarda en `localStorage` (`somos-brasil-user`). Esto es una
decisión consciente (ver `docs/plan.md`, secciones 2.1 y "decisión D1"): los ids de usuario viajan
en las queries con RLS permisiva.