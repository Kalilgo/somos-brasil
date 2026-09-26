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
(todos los cambios viven en localStorage). Para usar el backend real, seguí la sección [Deploy](#deploy).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Vite dev server (puerto 5173) |
| `npm run build` | Build de producción |
| `npm run typecheck` | tsc sin emitir |
| `npm run lint` | oxlint |

## Usuarios

No hay sistema de auth. Los 6 integrantes existen por seed y se eligen desde el selector de
usuario en `/` (estilo Netflix); el usuario activo se guarda en `localStorage` (`somos-brasil-user`).
Decisión consciente (ver `docs/plan.md`, secciones 2.1 y "decisión D1"): los ids de usuario viajan
en las queries con RLS permisiva.

---

## Deploy

> 🧑‍💻 **¿No sabés cómo?** Seguí el [manual paso a paso para no técnicos](docs/MANUAL_DEPLOY.md)
> (git + Supabase + Vercel desde cero, todo desde las páginas web).

### 1. Backend (Supabase)

Requisitos: CLI de Supabase logueado (`supabase login`).

```bash
# 1. Crear el proyecto (anotar el REFERENCE ID devuelto)
supabase projects create --name somos-brasil --org-id <tu-org-id>

# 2. Vincular el repo al proyecto
supabase link --project-ref <REFERENCE_ID>

# 3. Aplicar migraciones 0001-0005 (incluye el seed de usuarios/categorías/badges y el trip demo)
supabase db push

# 4. Desplegar las edge functions (son públicas: auth none, verify_jwt=false en config.toml)
supabase functions deploy calculate-trip-summary
supabase functions deploy get-leaderboard
supabase functions deploy add-to-itinerary
```

Mirá que no haya errores del lado del server con:

```bash
supabase functions logs calculate-trip-summary
```

> **Estados del proyecto**: las ideas confirmadas con precio alimentan el resumen y el leaderboard
> vía `0005_views_and_functions.sql`. Si cargás datos a mano, las funciones calculan en vivo.

#### Keys de cliente (para el frontend)

```bash
# Anon key publica (la usa el browser; RLS permisiva protege nada, es un MVP para el grupo)
supabase projects api-keys --project-ref <REFERENCE_ID>
```

De ahí copiá la **`anon` public key** (o la `publishable` key del dashboard). Ver paso 3 de frontend.

> Las edge functions usan la service role key automáticamente en runtime (`ctx.supabaseAdmin`);
> no hace falta setear nada extra en el proyecto.

### 2. Frontend (Vercel)

Requisitos: cuenta de Vercel. Podés hacerlo por dashboard o CLI:

```bash
npx vercel login
npx vercel link                        # en la raíz del repo (monorepo)
npx vercel env add VITE_SUPABASE_URL production     # https://<tu-proyecto>.supabase.co
npx vercel env add VITE_SUPABASE_ANON_KEY production # la anon key del paso anterior
npx vercel --prod
```

Configuración del proyecto en Vercel (dashboard o `vercel.json`):
- **Build command**: `npm run build`
- **Output directory**: `apps/web/dist`
- **Root directory**: repo root (Vercel detecta el monorepo; el build usa workspaces)

> **Sin `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`** el deploy corre en **modo demo**: sirve para
> mostrar la UI, pero los datos se pierden por navegador. Para producción real definí las dos env vars.

### 3. Conectar el frontend a Supabase (local)

```bash
cp apps/web/.env.example apps/web/.env.local
# completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

### Rollback / datos

- Migraciones: `supabase migration repair` + `supabase db push` para estados descosidos.
- Reset de datos de demo (si el proyecto es dev): `supabase db reset` (borra y reaplica todo).

---

## Documentación de diseño

- `docs/LOCAL.md` — desarrollo local: base de datos en Docker, los tres ambientes y por qué `npm run dev` no puede tocar producción.
- `docs/DEFENSA.md` — qué está protegido, cómo, y lo que hay que configurar a mano en el dashboard.
- `docs/plan.md` — plan completo, datamodel (§2), RLS (§3), edge functions (§7) y decisiones (D1-D5, Ñ1-Ñ2).
- `docs/decisions.md` — ADRs de las decisiones tomadas.