# Somos Brasil — Fase de Mapeo y Planificación

> Documento de diseño previo a implementación. Para revisar, ajustar y **aprobar**.
> Versión: v0.1 (borrador) · Estado: pendiente de aprobación

---

## 0. Resumen ejecutivo y decisiones clave

| # | Decisión | Elección propuesta | ¿Bloquea? |
|---|----------|--------------------|-----------|
| D1 | "Usuario actual" sin Auth | **Opción simple**: RLS permisivo + `user_id` desde el cliente (localStorage). Documentada como decisión consciente. | No (recomendada para MVP) |
| D2 | Moneda del presupuesto | **Moneda por viaje** se define al crear el trip (default `USD`); cada idea puede listar su propia moneda y el resumen agrupa por moneda. Sin conversión en el MVP. | Sí, definir antes |
| D3 | Cálculo de totales y ranking | **Vistas SQL + Edge Functions livianas** que encapsulan la lógica de totales y gamificación (ver sección 7). | No |
| D4 | Itinerario | Un ítem de itinerario = una idea confirmada ubicada en un `day_number` (orden por día). Sin drag & drop en MVP (flujo "agregar al itinerario" + reordenar). | Sí, definir antes |
| D5 | Stack frontend | Vite + React 19 + TypeScript + Tailwind v4 + React Router v7 + Zustand v5 + Motion (ex Framer Motion). | No |
| D6 | Layout de detalle de viaje | Rutas anidadas por sección (`/ideias`, `/itinerario`, `/resumo`, `/ranking`) que comparten el header del trip y navegan con tabs. | No |
| D7 | Gamificación | Ranking por trip + badges globales por usuario calculados con vistas SQL. Confetti + toasts como celebración visual. | No |

---

## 1. Estructura del proyecto (monorepo, repo único `somos-brasil`)

```
somos-brasil/
├── apps/
│   └── web/                          # Frontend: Vite + React (desplegado en Vercel)
│       ├── public/
│       │   └── favicon.svg
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx              # Router + providers
│       │   ├── routes/              # Co-located pages (lazy) — 1 archivo por ruta
│       │   │   ├── UserSelector.tsx      # Screen "¿Quién sos?" (/)
│       │   │   ├── TripsHome.tsx         # Home de viajes (/viajes)
│       │   │   ├── TripLayout.tsx        # Header + tabs + <Outlet/> (/viajes/:id)
│       │   │   ├── TripDashboard.tsx
│       │   │   ├── IdeasFeed.tsx         # Ideas + filtros (/viajes/:id/ideias)
│       │   │   ├── Itinerary.tsx         # (/viajes/:id/itinerario)
│       │   │   ├── TripSummary.tsx       # (/viajes/:id/resumo)
│       │   │   └── Ranking.tsx           # (/viajes/:id/ranking)
│       │   ├── components/
│       │   │   ├── ui/               # Primitivas del design system (ver §5)
│       │   │   ├── layout/           # AppShell, AppHeader, TripHeader, TabBar
│       │   │   ├── user/             # UserCard, Avatar, UserSwitcherMenu
│       │   │   ├── trip/             # TripCard, CreateTripModal, MemberPicker
│       │   │   ├── idea/             # IdeaCard, IdeaForm, FilterChips, ReactionPicker
│       │   │   ├── itinerary/        # ItineraryDay, AddToItineraryModal
│       │   │   ├── gamification/     # Leaderboard, StreakFlame, BadgeChip, Confetti
│       │   │   └── feedback/         # Toast, EmptyState, LoadingState, ConfirmDialog
│       │   ├── hooks/                # useIdeas, useTrip, useMembers, useLeaderboard, useMediaQuery...
│       │   ├── lib/
│       │   │   ├── supabase/         # client.ts (browser), types.ts
│       │   │   ├── state/            # stores Zustand: auth, trips, ideas, itinerary, toasts
│       │   │   ├── utils/            # cn(), formatPrice(), timeAgo(), constants (USERS, EMOJIS)
│       │   │   └── query.ts          # wrapper liviano fetch/postgrest (estado + revalidación)
│       │   ├── styles/
│       │   │   ├── main.css          # entrada Tailwind
│       │   │   └── theme.ts          # tokens: paleta, tipografía, radios, sombras
│       │   ├── types/
│       │   └── vite-env.d.ts
│       ├── index.html
│       ├── .env.example              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts        # (o CSS-first en v4)
│       └── tsconfig.json
│
├── supabase/                         # Backend: config + migraciones + funciones
│   ├── config.toml
│   ├── migrations/                   # SQL versionado tipo <timestamp>_<nombre>.sql
│   │   ├── 0001_init_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   ├── 0003_seed_users_categories_badges.sql
│   │   ├── 0004_seed_demo_trip.sql         # trip demo con ideas/votos (para desarrollar)
│   │   └── 0005_trip_summary_views.sql
│   ├── functions/                    # Edge Functions (Deno)
│   │   ├── calculate-trip-summary/index.ts
│   │   ├── get-leaderboard/index.ts
│   │   └── _shared/cors.ts, _shared/supabase.ts
│   └── tests/                        # tests de policies/validación (opcional)
│
├── docs/
│   ├── plan.md                       # este documento
│   └── decisions.md                  # ADR: usuario sin auth, moneda, RLS permisivo
│
├── README.md                         # setup local + deploy + decisiones documentadas
├── package.json                      # workspaces raíz (npm)
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
└── .gitignore
```

**Qué vive en cada carpeta:**
- `apps/web` — único frontend. Todo lo visual. Se comunica con Supabase vía `@supabase/supabase-js`.
- `supabase/` — definición declarativa completa del backend. Migraciones versionadas aplicadas con Supabase CLI; el seed de usuarios vive en migración para que sea reproducible.
- `docs/` — decisiones de arquitectura en formato ADR (Action Decision Records) cortos.
- Monorepo con npm workspaces: un solo `package.json` raíz con el workspace `apps/web`. Sin Turborepo (todavía no lo justifica un solo app).

---

## 2. Modelo de datos completo

Convenciones: PK siempre `uuid default gen_random_uuid()` salvo check explicito; fechas `timestamptz`; naming snake_case; `updated_at` con trigger si la tabla se edita. Sin auth: no hay `auth.users`, los usuarios son la tabla `users` (seed).

### 2.1 users (seed fijo de 6)

| Columna | Tipo | Constraint | Notas |
|---------|------|-----------|-------|
| id | uuid | PK default gen_random_uuid() | |
| name | text | NOT NULL, UNIQUE | QUEME / FLOR / DOZO / HONGO / GONZA / KALIL |
| emoji | text | NOT NULL | identificatorio, ej. 🔥 |
| color | text | NOT NULL | hex para avatar/fondo, ej. `#FF5A5F` |
| bio | text | nullable | una frase divertida |
| sort_order | int | NOT NULL default 0 | orden fijo en selector |
| created_at | timestamptz | NOT NULL default now() | |

**Asignación propuesta (ajustable antes de implementar):**

| Usuario | Emoji | Color |
|---------|-------|-------|
| QUEME | 🔥 | `#FF5A5F` |
| FLOR | 🌺 | `#FF4D6D` |
| DOZO | 🦖 | `#7C3AED` |
| HONGO | 🍄 | `#10B981` |
| GONZA | ⚽ | `#F59E0B` |
| KALIL | 🐪 | `#0EA5E9` |

### 2.2 trips

| Columna | Tipo | Constraint | Notas |
|---------|------|-----------|-------|
| id | uuid | PK | |
| name | text | NOT NULL, CHECK (length(name) between 1 and 80) | |
| description | text | nullable | |
| currency | text | NOT NULL default 'USD', CHECK IN ('USD','BRL','ARS','MXN','EUR') | moneda de referencia del presupuesto (D2) |
| start_date | date | nullable | |
| end_date | date | nullable | |
| status | text | NOT NULL default 'planning', CHECK IN ('planning','confirmed','done') | |
| created_by | uuid | FK → users(id) | |
| created_at | timestamptz | | |
| updated_at | timestamptz | | trigger de update |

Índices: `idx_trips_status(status)`, `idx_trips_created_by(created_by)`.

### 2.3 trip_members (N:M trips↔users)

| Columna | Tipo | Constraint |
|---------|------|-----------|
| trip_id | uuid | FK → trips(id) ON DELETE CASCADE |
| user_id | uuid | FK → users(id) ON DELETE CASCADE |
| joined_at | timestamptz | NOT NULL default now() |

- PK compuesta `(trip_id, user_id)`.
- Índice en `user_id` para joins de ranking.

### 2.4 categories (catálogo fijo de 7)

| Columna | Tipo | Constraint | Notas |
|---------|------|-----------|-------|
| id | uuid | PK | |
| slug | text | NOT NULL UNIQUE | `destino, alojamiento, transporte, lugares, comida, actividades, extras` |
| name | text | NOT NULL | "Lugares para visitar", "Comida y bares"... |
| emoji | text | NOT NULL | ✈️ 🛏️ 🍹... |
| color | text | NOT NULL | tint del filtro/chip |
| sort_order | int | NOT NULL | |

Es **catálogo global** (no por trip) y el seed lo crea. No hace falta CRUD en MVP.

### 2.5 ideas

| Columna | Tipo | Constraint | Notas |
|---------|------|-----------|-------|
| id | uuid | PK | |
| trip_id | uuid | FK → trips(id) ON DELETE CASCADE | |
| category_id | uuid | FK → categories(id) | |
| user_id | uuid | FK → users(id) (proponente) | atribución desde el cliente |
| title | text | NOT NULL, CHECK (1..120) | |
| description | text | nullable | |
| link | text | nullable | validación URL en el cliente |
| image_url | text | nullable | |
| price | numeric(12,2) | nullable, CHECK (price >= 0) | null = "no tiene precio / a definir" |
| currency | text | NOT NULL default 'USD', CHECK IN (...) | override por idea |
| status | text | NOT NULL default 'proposal', CHECK IN ('proposal','discussing','confirmed','discarded') | flujo: propuesta → en discusión → confirmada → descartada |
| created_at | timestamptz | | |
| updated_at | timestamptz | | trigger |

Índices: `idx_ideas_trip(trip_id)`, `idx_ideas_trip_category(trip_id, category_id)`, `idx_ideas_trip_status(trip_id, status)`.

### 2.6 votes (reacciones por usuario por idea)

| Columna | Tipo | Constraint |
|---------|------|-----------|
| id | uuid | PK |
| idea_id | uuid | FK → ideas(id) ON DELETE CASCADE |
| user_id | uuid | FK → users(id) |
| reaction | text | NOT NULL, CHECK IN ('🔥','❤️','😐','🙅') |
| created_at | timestamptz | |

- **UNIQUE (idea_id, user_id)**: 1 voto por usuario por idea; votar de nuevo = **upsert** cambia la reacción.
- Índice en `(idea_id)` para conteos.

### 2.7 comments

| Columna | Tipo | Constraint |
|---------|------|-----------|
| id | uuid | PK |
| idea_id | uuid | FK → ideas(id) ON DELETE CASCADE |
| user_id | uuid | FK → users(id) |
| body | text | NOT NULL, CHECK (1..500) |
| created_at | timestamptz | |

- Índice en `(idea_id, created_at)`.

### 2.8 itinerary_items

| Columna | Tipo | Constraint | Notas |
|---------|------|-----------|-------|
| id | uuid | PK | |
| trip_id | uuid | FK → trips(id) ON DELETE CASCADE | |
| idea_id | uuid | FK → ideas(id), **UNIQUE** | una idea confirmada entra 1 sola vez (D4) |
| day_number | int | NOT NULL CHECK (>= 1) | día 1 = primer día del viaje (no fecha literal) |
| sort_order | int | NOT NULL default 0 | orden dentro del día |
| notes | text | nullable | |
| added_by | uuid | FK → users(id) | |
| created_at | timestamptz | | |

Índice: `idx_itinerary_trip_day(trip_id, day_number, sort_order)`.
Constraint adicional: solo se puede agregar a itinerario una idea con `status = 'confirmed'` (validado en Edge Function / app; ver §8).

### 2.9 Gamificación

**badges (catálogo fijo):**

| Columna | Tipo | Constraint |
|---------|------|-----------|
| id | uuid | PK |
| key | text | NOT NULL UNIQUE |
| name | text | NOT NULL |
| description | text | NOT NULL |
| emoji | text | NOT NULL |
| color | text | NOT NULL |
| criteria | text | NOT NULL (explica cómo se gana) |

Badges propuestos: 🧭 Explorador (propuso en ≥4 categorías), 💸 Cazador de ofertas (3 ideas con el precio más bajo en su categoría), ⚡ Turbina (3+ votos el primer día), 🎤 Traí más gente (invitó ≥2 miembros)... — ajustables.

**user_badges (earned):**

| Columna | Tipo | Constraint |
|---------|------|-----------|
| user_id | uuid | FK → users(id) ON DELETE CASCADE |
| badge_id | uuid | FK → badges(id) ON DELETE CASCADE |
| earned_at | timestamptz | NOT NULL default now() |

- PK compuesta `(user_id, badge_id)`.

**activity_stats**: NO es tabla — es un **conjunto de vistas SQL** que computan en vivo desde ideas/votes/comments (6 usuarios, datos chicos, no amerita contadores mantenidos):

- `view_user_stats` → por usuario global y por trip: ideas_propuestas, votos_hechos, comentarios, ideas_confirmadas, reacciones_recibidas.
- `view_streaks` → racha (días consecutivos con actividad) desde `created_at` de ideas + votes + comments.
- `view_reaction_time` → latencia promedio de voto (diff entre `votes.created_at` y `ideas.created_at`).
- `view_leaderboard(trip_id)` → ranking combinado con score = ideas + votos + comentarios ponderado.
- Badges se materializan como filas en `user_badges` cuando una Edge Function `get-leaderboard` las detecta (o job on-demand al abrir el ranking).

### 2.10 Diagrama de relaciones

```
users 1 ──< trips.created_by >── 1 trips
trips  1 ──< trip_members >── 1 users   (N:M)
trips  1 ──< ideas >── 1 categories     (categoría por idea)
ideas  1 ──< votes >          users     (1 voto por user+idea)
ideas  1 ──< comments >       users
ideas  1 ──< itinerary_items  (idea UNIQUE)
trips  1 ──< itinerary_items
users  1 ──< user_badges >── 1 badges   (N:M)
ideas  1 ──< (cascade) votes/comments/everything
```

---

## 3. Políticas RLS

**Decisión (D1): opción simple.** RLS **habilitado** en todas las tablas pero con policies **permisivas** (`using (true)` / `with check (true)`) para SELECT/INSERT/UPDATE/DELETE. El "usuario actual" es atribución desde el cliente, nunca mecanismo de seguridad. Documentado en README + ADR. Anon key y URL no públicas + grupo cerrado de 6 amigos + sin datos sensibles son la justificación. La robustez futura (JWT por Edge Function con claim `app_user_id`) queda como ADR "futuro", no bloquea el MVP.

| Tabla | Policy | Operación | Expresión | Justificación |
|-------|--------|-----------|-----------|---------------|
| users | read_all | SELECT | `true` | lista de 6 conocidos, se muestra en selector/avatares |
| users | write_all | INSERT/UPDATE/DELETE | `true` | solo seed; no hay escrituras de clientes en MVP |
| trips | read_all | SELECT | `true` | datos de grupo |
| trips | write_all | INSERT/UPDATE/DELETE | `true` | CRUD de viaje por cualquiera de los 6 |
| trip_members | read_all | SELECT | `true` | |
| trip_members | write_all | INSERT/UPDATE/DELETE | `true` | |
| categories | read_all | SELECT | `true` | catálogo fijo |
| categories | write_all | INSERT/UPDATE/DELETE | `true` (solo seed) | |
| ideas | read_all | SELECT | `true` | |
| ideas | write_all | INSERT/UPDATE/DELETE | `true` | `user_id` lo manda el cliente |
| votes | read_all | SELECT | `true` | |
| votes | write_all | INSERT/UPDATE/DELETE | `true` | upsert por (idea,user) |
| comments | read_all | SELECT | `true` | |
| comments | write_all | INSERT/UPDATE/DELETE | `true` | |
| itinerary_items | read_all | SELECT | `true` | |
| itinerary_items | write_all | INSERT/UPDATE/DELETE | `true` | |
| badges | read_all | SELECT | `true` | |
| user_badges | read_all | SELECT | `true` | |
| user_badges | write_all | INSERT | `true` | lo escribe la Edge Function |

Notas: anon role → `GRANT USAGE ON SCHEMA public`, `GRANT ALL ON ALL TABLES` (o por tabla). Las vistas de stats se exponen como SELECT. En `docs/decisions.md` queda el ADR que explica por qué esta opción y cuándo migrar a la robusta.

---

## 4. Mapa de rutas y pantallas

Router: React Router v7 (data mode, `createBrowserRouter` + `RouterProvider`). Todas las rutas bajo el "shell" autenticado redirigen a `/` si no hay usuario en localStorage.

| Ruta | Pantalla | Función | Guard |
|------|----------|---------|-------|
| `/` | UserSelector | "¿Quién sos?" — 6 cards grandes (emoji + color + nombre). Guarda en localStorage `somos-brasil-user` | si ya hay user → redirect a `/viajes` |
| `/viajes` | TripsHome | Lista de viajes (cards con fechas, # miembros, % avance) + botón "Crear viaje" (modal) | requiere user |
| `/viajes/:tripId` | TripLayout (+ Dashboard) | Header del trip (nombre, fechas, moneda, miembros) + tabs de sección + outlet. Dashboard: resumen rápido (conteos por categoría, próximas actividades, costo estimado) | requiere user + trip cargado |
| `/viajes/:tripId/ideias` | IdeasFeed | Grid/list de ideas con **filtros** (`?categoria=`, estado, orden por precio/votos), botón "+ Nueva idea" (modal). Desde acá se vota, comenta, confirma/descarta | |
| `/viajes/:tripId/itinerario` | Itinerary | Línea de tiempo por día (Day 1, Day 2...), ítems ordenables con botones ↑/↓ y mover a otro día. Botón "Agregar confirmadas" | |
| `/viajes/:tripId/resumo` | TripSummary | Costo total por categoría, total por moneda, costo por persona, top ideas. Llamá a la Edge Function `calculate-trip-summary` | |
| `/viajes/:tripId/ranking` | Ranking | Leaderboard: score, racha 🔥, barra de progreso, badges ganados por cada uno + confetti al entrar si detecta badge nuevo | |
| `*` | NotFound | 404 con humor | |

**Navegación**: el tab bar inferior en móvil / sidebar-chips en desktop soporta las 4 secciones del trip. Modales (no rutas) para: crear viaje, agregar idea, agregar al itinerario, confirmar destructivas.

**Flujo a nivel de transición/estado**: overlay suave entre secciones (tabs) con Motion; skeleton-loaded por pantalla con mensajes graciosos.

---

## 5. Mapa de componentes reutilizables

**Design system (`components/ui`)** — tokens en `styles/theme.ts` (paleta, tipografía display "Baloo 2" + cuerpo system, radios, sombras, espaciado 4px base):

| Componente | Uso en | Variantes/Props clave |
|------------|--------|-----------------------|
| `Button` | global | variant: primary/secondary/ghost/danger; tamaño sm/md/lg; loading (spinner + copy gracioso); icono |
| `IconButton` | global | avatar menú, reacciones, acciones de card |
| `Card` | trip/idea/itinerario | elevación, hover lift, padding, clickable |
| `Modal` / `Sheet` | tablas de create/edit | **bottom-sheet en móvil**, diálogo en desktop; focus trap, ESC, overlay animado |
| `Input` / `TextArea` / `Select` | todos los forms | label flotante, errores, adornos (₲ $), estado focus |
| `Badge` | estados (propuesta/en disc./confirmada/descartada), categorías | color por semáforo de estado |
| `Avatar` | header, ideas, comentarios, ranking | color de fondo + emoji; tamaño xs→xl |
| `Toast` / `ToastProvider` | global (feedback) | success/error/info con animación slide + auto-close; cola |
| `EmptyState` | listas vacías | emoji grande + copy + CTA ("Todavía no hay nada acá... ¡proponé vos!") |
| `LoadingState` | pantallas | spinner + frases rotativas ("Ordenando las maletas...", "Consultando al oráculo del viaje...") |
| `ConfirmDialog` | acciones destructivas | "¿Seguro que la descartás?" botones con humor |
| `Confetti` | confirmaciones/badges nuevos | canvas liviano (canvas-confetti) |
| `Tabs` / `Segmented` | navegación de sección | anima el indicador del tab activo |
| `FilterChips` | IdeasFeed | categoría + estado + orden, pill con emoji y conteo |
| `ReactionPicker` | IdeaCard | 4 emojis, pre-selecciona mi voto, anima y pide confirmación para 🙅 |
| `PriceTag` | IdeaCard / summary | formato moneda localizado + "~ por noche" modos |
| `ProgressBar` | ranking, avance de trip | color por usuario, animación de llenado |
| `StreakFlame` | ranking/user menu | 🔥 con días de racha |
| `DropdownMenu` | avatar header → "¿No sos vos? Cambiar usuario" | lista de 6, marca activo |

**Layout**: `AppShell` (header global con logo + avatar y menú de usuario + app de navegación según ancho), `TripHeader` (contexto del viaje), `SectionNav` (tabs responsive).

**Regla**: cada componente tiene sus props tipadas, estados de focus/disabled/loading, y accesibilidad básica (aria-label, roles, teclado en modales/pickers).

---

## 6. Mapa de estado global (Zustand) vs estado local

**Stores globales (Zustand, con persistencia selectiva):**

| Store | Qué contiene | Persistido | Notas |
|-------|--------------|-----------|-------|
| `useAuthStore` | `currentUser` (user entero) | **sí**: localStorage `somos-brasil-user` (json) | `setUser`, `logout` (limpia y redirige a `/`) |
| `useTripsStore` | `trips[]`, `currentTrip`, `members[]`, `loading`, `error` | no | fetch por `/viajes` y `/viajes/:id`; carga 1 sola vez (TTL) |
| `useIdeasStore` | `ideas[]`, `votes[]` (por trip), filtros activos (categoría/estado/orden), `comments` por idea | filtros sí (sessionStorage, opcional) | las mutaciones optimistas live aquí |
| `useItineraryStore` | `items[]`, orden e `isDirty` | no | optimista resequencing |
| `useToastStore` | `toasts[]` | no | add/dismiss programático |
| `useLeaderboardStore` | `ranking`, `badges`, `newBadge` recién ganado | no | alimenta confetti |

**Estado local de componente** (no global): formularios (nueva idea, editar, crear trip), open/closed de modales, picker de reacción abierto, debounce de búsqueda, tab hover, drag visual, estado de filtro transitorio del input. Regla: **si lo usa UNA sola vista y no lo comparte nadie, es local**; si lo leen 2+ vistas (usuario, ideas del trip, toasts) → store.

**Carga de datos**: wrapper `lib/query.ts` liviano (no react-query en MVP): `useQuery` propio con `useSyncExternalStore` o fetcher + estado en store; mutaciones optimistas con rollback + toast de error.

---

## 7. Plan de Edge Functions

Backing por **vistas SQL** (§2.9/§2.10); las Edge Functions encapsulan cálculo + validación y dan un único punto servidor. En el MVP se invocan al entrar a `/resumo` y `/ranking`.

| Función | Input | Output | Lógica clave | Error paths |
|---------|-------|--------|--------------|-------------|
| `calculate-trip-summary` | `{ trip_id }` | `{ totals_per_category: [{slug, label, emoji, total, count}], totals_per_currency, per_person: [{currency, total, per_member}], confirmed_total, status }` | Agrupa ideas confirmadas por categoría y moneda; divide por count de `trip_members`; excluye `discarded`. | 404 si el trip no existe; validación UUID; 400 si miembros = 0 |
| `get-leaderboard` | `{ trip_id }` | `{ ranking: [{user_id, name, emoji, color, score, ideas, votes, comments, streak_days}], badges: [{user_id, badge_key, name, emoji}], newly_earned: [badge...] }` | Score ponderado (ideas×3 + votes×1 + comments×2); computa racha y latencia de voto; detecta badges cumplidos → **inserta** `user_badges` (idempotente, ON CONFLICT DO NOTHING) y devuelve los nuevos para celebrar. | 404 trip; solo devuelve miembros inscriptos |
| `add-to-itinerary` *(opcional)* | `{ trip_id, idea_id, day_number }` | `{ ok: true, item }` | Valida que `idea.status='confirmed'` antes de insertar (regla de negocio que no debe vivir solo en el cliente). | 409 si la idea ya está en itinerario; 400 si no está confirmada |

**Decisión D3**: si preferimos menos superficie, `add-to-itinerary` puede ser un trigger de BD (`BEFORE INSERT ... IF status <> 'confirmed' THEN RAISE EXCEPTION`) y `calculate-trip-summary` puede quedar como vista + un `.select()` en el cliente. Lo dejo en el checklist como ✅/❌ a decidir; el plan por defecto incluye las 3 funciones.

---

## 8. Flujos de usuario clave (paso a paso)

**F1. Primer acceso / elegir usuario**
1. GET `/` → `useAuthStore.currentUser` vacío → `UserSelector` muestra 6 cards (emoji + color + nombre) con animación stagger.
2. Tap card → guarda `currentUser` en localStorage → confetti chico + toast "¡Bienvenido/a, {name}!" → redirect `/viajes`.
3. Reabrir la app → el guard lee localStorage → entran directo.
4. **Cambiar usuario**: avatar en header → menú "¿No sos vos? Cambiar usuario" → selector (logout + redirect `/`).

**F2. Crear viaje**
1. `/viajes` → botón "Crear viaje" → modal con: nombre, descripción, fechas tentativas, **moneda (D2)**, destino(s) posible(s) en el description, y picker de miembros (el creador ya viene marcado; se togglean los otros 5).
2. Submit → INSERT trips + trip_members (por cada integrante) → toast "¡Let's go, Brasil!" + confetti → redirect al trip.
3. Vista vacía → EmptyState invita a agregar la primera idea.

**F3. Agregar idea**
1. En cualquier sección, CTA "+ Nueva idea" → modal `IdeaForm`: categoría (chips con emoji), título, descripción, link, imagen (URL), precio + moneda.
2. Validación: título requerido, URL bien formada, precio ≥ 0. Errores inline con humor.
3. Submit → INSERT optimista → toast + mini confetti → la card aparece en el feed con tu avatar.
4. Estados vacíos por categoría → EmptyState ("Nadie propuso alojamiento todavía 👀").

**F4. Votar / reaccionar**
1. En `IdeaCard` → `ReactionPicker` con 🔥 ❤️ 😐 🙅 → tap → **upsert optimista** en `votes` (item se mueve/actualiza el contador de esa reacción, animación bounce).
2. Votar de nuevo = cambiar reacción (update en caliente).
3. Confirmación del 🙅: pequeño micro-diálogo "¿En serio la descartás?" para evitar votos impulsivos. (🙅 voto ≠ estado descartado; son cosas distintas.)

**F5. Comentar**
1. Card → sección comentarios → textarea + Enter → INSERT optimista con tu avatar → aparece al instante → contador de comentarios se actualiza en la card.

**F6. Cambiar estado de idea (flujo completo propuesta→confirmada→itinerario)**
1. En la card: menú de estado (Propuesta → En discusión → Confirmada → Descartada).
2. Hacia **Confirmada**: confirmación "¿La confirmamos? Se va al itinerario 🗓️" → toast + confetti → animación de "aprobada" (badge verde).
3. Hacia **Descartada**: ConfirmDialog destructivo.
4. Al confirmar → oferta inline "¿Agregarla al itinerario?" → `AddToItineraryModal` (día 1..N) → `itinerary_items`.

**F7. Itinerario**
1. Sección itinerario → línea de tiempo por día. Cada ítem = idea confirmada (badge de categoría + costo).
2. Reordenar con ↑/↓ y mover de día; NOTES editables. Optimista + persist.
3. En móvil, control de "mover a día" como sheet; en desktop quick-select.

**F8. Resumen**
1. `/resumo` → llama `calculate-trip-summary` → cards por categoría (total + conteo), total por moneda, **costo por persona** (dividido por members). Animación de conteo de números.
2. CTA compartible: "Copiar resumen" → clipboard con texto lindo para el grupo de WhatsApp.

**F9. Ranking / gamificación**
1. `/ranking` → `get-leaderboard` → lista ordenada con avatar, score, racha 🔥, badges.
2. Si hay `newly_earned` → confetti + toast "¡FLOR ganó el badge Explorador! 🧭".
3. Tap en un usuario → mini perfil con sus stats + badges.

**F10. Cambio de usuario sobre la marcha**
1. Header avatar → menú → "¿No sos vos? Cambiar usuario" → selector. Desloguea el store actual y repinta con el nuevo usuario. Sin pérdida de datos (todo persiste en Supabase).

---

## 9. Convenciones y despliegue

- **Git**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`). Ramas `feat/*`, PR a `main` con template, sin push directo a `main`.
- **Vercel**: conectado al repo → build `apps/web` (`npm install`, `npm run build -w web`, output `apps/web/dist`). Env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en dashboard (no en git). Preview deployments por PR.
- **Supabase**: vinculado al repo → migraciones aplicadas con CLI (`supabase db push`), seed desde migraciones. Env del proyecto local en `.env` del directorio supabase (no versionado; `.env.example` sí).
- **Envs separadas front/backend**: `apps/web/.env` (VITE_ *) y `supabase/.env` (SUPABASE_ACCESS_TOKEN, DB URL).
- **README**: setup local (pasos), deploy, y la **decisión documentada** sobre usuario sin auth (opción simple, riesgos, plan robusto futuro).
- **Seed demo** (`0004`): un trip de ejemplo con las 7 categorías pobladas para desarrollar y probar la UI desde el día 1. Se documenta cómo borrarlo en prod.

---

## 10. Orden de implementación sugerido (checklist)

> Cada item incluye: acceptance criteria mínimos + verificación (lint/typecheck/build) antes de avanzar.

- [ ] **0. Fundación repo**: git init, workspaces, .gitignore, README base, CI básico. Init Vite + TS + Tailwind v4 + Router + Zustand + Motion. Lint (ESLint) + typecheck.
- [ ] **1. Backend — esquema**: migración `0001` (tablas §2 + triggers updated_at). `0002` RLS permisiva. Roles/grants. Puesta en Supabase local (CLI) y remoto.
- [ ] **2. Backend — seed**: `0003` usuarios fijos + categorías + badges. `0004` trip demo.
- [ ] **3. Backend — vistas y edge functions**: `0005` views stats/leaderboard/summary. Edge functions `calculate-trip-summary`, `get-leaderboard`, `add-to-itinerary` con CORS + tests de smoke.
- [ ] **4. Frontend — infra**: cliente supabase tipado (client.ts + types.ts), wrapper query, toasts, theme, botones/cards/form primitives.
- [ ] **5. Selector de usuario**: `/`, store auth con persistencia, guard, menú "cambiar usuario". *Verificable end-to-end.*
- [ ] **6. CRUD de viajes**: `/viajes` + modal crear + members picker + layout del trip con tabs.
- [ ] **7. Ideas**: feed, filtros (categoría/estado/orden), form, CRUD optimista, estados vacíos/loading.
- [ ] **8. Votación y comentarios**: ReacionPicker upsert optimista, animaciones, comentarios en card.
- [ ] **9. Estados e itinerario**: transiciones de estado, confirm dialog, agregar al itinerario, vista por día, reordenar.
- [ ] **10. Resumen y ranking**: edge functions conectadas, resumen con conteo animado, leaderboard + badges + confetti.
- [ ] **11. Pulido responsive + a11y + copy**: revisión mobile/tablet/desktop, focus/tabbing, contrastes, mensajes graciosos en todos los estados.
- [ ] **12. Despliegue y docs**: Vercel + Supabase linked, README completo, ADR finales.

---

## 11. Checklist de decisión abierta (para la revisión)

Antes de arrancar, confirmar con ✅/❌:

- [ ] **D1** — Opción simple (RLS permisiva + user de cliente). ✅ (recomendado) / ❌ implementar JWT.
- [ ] **D2** — Moneda por viaje (default USD), ideas pueden tener su moneda, resumen agrupa. Sin conversión en MVP. ✅ / ❌ algo distinto.
- [ ] **D3** — Edge Functions para summary/leaderboard para el MVP (más liviano: vistas + cliente). ✅ edge functions / ❌ vistas + cliente.
- [ ] **D4** — Itinerario: 1 idea confirmada = 1 ítem en 1 día, reorden básico (sin drag & drop). ✅ / ❌ drag & drop desde el día 1.
- [ ] **D5** — Emojis/colores de los 6 usuarios (tabla §2.1). ¿Confirmás las asignaciones? Se ajustan gratis.
- [ ] **Ñ1** — ¿Raíz `somos-brasil/` con `apps/web` + `supabase/` (workspaces) o frontend directo en la raíz `web/`? (recomendado: `apps/web`).
- [ ] **Ñ2** — Reacción "🙅" como voto (≠ descartar). ¿OK o preferís solo 3 reacciones + descartar como acción de estado?

---

> Al aprobar (o con los ajustes), comienzo por el item 0 del checklist §10.