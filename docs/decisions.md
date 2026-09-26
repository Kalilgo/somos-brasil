# Decisiones (ADR)

Decisiones de diseño del proyecto Somos Brasil. Cada ADR describe el contexto, la
decisión tomada y cuándo revisarla.

## ADR-001 — No hay sistema de auth (usuarios por seed + PIN del grupo)

**Estado:** aceptado (MVP) — **parcialmente revertido, ver ADR-005**

**Contexto:** grupo cerrado de 6 amigos. Configurar Supabase Auth + invitaciones
añade superficie sin valor para el MVP.

**Decisión original (corregida):**
- Tabla `users` fija con 6 registros por seed.
- El "usuario actual" se guarda en `localStorage` (`somos-brasil-user`).
- RLS en solo lectura para `anon`/`authenticated`; la escritura pasa por edge
  functions.

> **Corrección (2026-02-14).** Este ADR decía antes que la app dependía de "la anon
> key **no pública**". Eso era falso y es importante corregirlo: la anon key viaja
> dentro del bundle de JavaScript que sirve Vercel, cualquiera la lee desde las
> devtools. No es un secreto y nunca debe tratarse como tal. Todo el análisis de
> riesgo de abajo tiene que partir de ahí, y coincide con lo que dice
> `docs/DEFENSA.md`.

**Riesgo vigente:** con la anon key, cualquiera en internet puede **leer** la base
completa por el Data API (RLS `using (true)` en las lecturas): nombres de los
integrantes, viajes, ideas, votos, comentarios y las fechas de viaje + ubicación de
cada persona. Escribir ya no está abierto: no hay policies de escritura para
`anon`/`authenticated` (migración 0012) y los grants son de solo `SELECT` (0015).

**Cuándo migrar a la variante robusta:** ver ADR-005.

## ADR-002 — Edge Functions con `verify_jwt = false`

**Estado:** aceptado (MVP) — **parcialmente revertido, ver ADR-005**

**Contexto:** la app no tiene sesión de Supabase Auth, así que las edge functions no
pueden exigir un user JWT de Supabase.

**Decisión:** todas las functions usan `withSupabase({ auth: 'none' })` +
`verify_jwt = false` (config.toml). `withSupabase` ya resuelve CORS y preflight, así
que no hay headers de CORS manuales que mantener.

**Estado real (esta sección quedó desactualizada):** hoy `login` y `member-actions`
**sí** autentican, con un JWT HS256 propio emitido por `login` tras validar el PIN
del grupo (`app_user_id`). `member-actions` es el único path de escritura de la app y
exige `Authorization: Bearer <jwt>`. `calculate-trip-summary` y `get-leaderboard`
siguen siendo públicas (solo leen; el rate limit por IP es lo único que las
frena). `add-to-itinerary` está deprecada, mantenida endurecida para no dejar un
path de escritura abierto.

**Cuándo mejorar:** al adoptar ADR-005.

## ADR-005 — Deuda conocida: la identidad no llega a Postgres

**Estado:** pendiente (es el agujero de fondo del modelo de seguridad)

**Contexto:** el PIN es un secreto de la edge function, no de Postgres. Por eso RLS
no tiene forma de saber quién llama y las policies se limitan a todo-o-nada: o
permitís todo (`using (true)`) o no permitís nada. Se eligió permitir lecturas, y
por eso la base es legible sin autenticarse.

**Por qué no se arregla con un header:** se intentó mandar el JWT custom como
`Authorization` global y PostgREST lo rechaza con 401, porque valida la firma contra
el JWT secret del proyecto, que es otro. Meterlo en un header custom tampoco: la
allow-list de CORS de `withSupabase` es fija y no lo incluye, así que el preflight
del browser fallaría.

**Cómo se arregla:** migrar la identidad a Supabase Auth. Cada usuario tiene su
propio secreto (deja de ser un PIN compartido que compromete a los 6 si se filtra),
`auth.uid()` funciona, RLS pasa a ser expresivo y aplicable, y las edge functions
pueden pasar a `auth: 'user'`. Para un grupo de 6 con invite, el costo es bajo y
cierra el último agujero grande.

**Mientras tanto:** lo que cerró la migración 0015 es el default de exposición
(grants fail-closed, `rate_limits` con RLS, RPC fuera del alcance de `anon`) y lo
que cerró `member-actions` es el borrado cruzado de ideas y la fuga de mensajes de
error de Postgres. Lo que queda abierto es la lectura sin autenticar.


## ADR-003 — Sin conversión de moneda (D2)

**Estado:** aceptado

Cada trip elige una moneda de referencia (default `USD` en `trips.currency`); cada
idea puede override con su propia moneda (ej. precios locales en `BRL`). El resumen
agrupa por moneda y muestra el costo por persona por moneda. No se convierten
valores (errores de tipo de cambio no aportan en la fase de planeo).

# PRD pendiente

- [ ] Lint SQL (pgTAP/supabase test) cuando se disponga de un Supabase local o remoto.
- [ ] Smoke test de las edge functions (`supabase functions serve` requiere Docker).