# Decisiones (ADR)

Decisiones de diseño del proyecto Somos Brasil. Cada ADR describe el contexto, la
decisión tomada y cuándo revisarla.

## ADR-001 — No hay sistema de auth (usuarios por seed + atribución desde el cliente)

**Estado:** aceptado (MVP)

**Contexto:** grupo cerrado de 6 amigos. Configurar Supabase Auth + invitaciones
añade superficie sin valor para el MVP. El flujo propone ideas/vota/comenta con una
identidad de "quién soy" elegida en la UI.

**Decisión:**
- Tabla `users` fija con 6 registros por seed.
- El "usuario actual" se guarda en `localStorage` (`somos-brasil-user`) y viaja como
  `user_id` en cada escritura (atribución, no autenticación).
- RLS permisivo (`using (true)`) en todas las tablas: la app depende de la anon key
  no pública + grupo cerrado + datos no sensibles.

**Riesgo:** cualquiera con la anon key pública puede leer/escribir todo. Aceptado
por el contexto cerrado.

**Cuándo migrar a la variante robusta:** si la app se abre al público, o se agrega
auth "de verdad". La migración prevista: triggers con el claim `app_user_id` en el
JWT (edge function emite un JWT custom por usuario), policies con
`auth.uid()`/claim, y guard de sesión en el cliente.

## ADR-002 — Edge Functions públicas (`auth: 'none'`), sin JWT

**Estado:** aceptado (MVP)

**Contexto:** la app no tiene sesión de usuario, por lo que las edge functions no
pueden exigir un user JWT.

**Decisión:** las tres edge functions (`calculate-trip-summary`, `get-leaderboard`,
`add-to-itinerary`) usan `withSupabase({ auth: 'none' })` +
`verify_jwt = false` (config.toml). Validan input y devuelven JSON con errores.

**Riesgo:** cualquiera puede invocarlas; el input está validado y la única escritura
(`user_badges` idempotente y `itinerary_items`) repite reglas de negocio.

**Cuándo mejorar:** al adoptar ADR-001 robusto, pasar a
`auth: ['publishable', 'secret']` o `auth: 'publishable'` y leer la identidad desde
el header `Authorization`.

## ADR-003 — Sin conversión de moneda (D2)

**Estado:** aceptado

Cada trip elige una moneda de referencia (default `USD` en `trips.currency`); cada
idea puede override con su propia moneda (ej. precios locales en `BRL`). El resumen
agrupa por moneda y muestra el costo por persona por moneda. No se convierten
valores (errores de tipo de cambio no aportan en la fase de planeo).

# PRD pendiente

- [ ] Lint SQL (pgTAP/supabase test) cuando se disponga de un Supabase local o remoto.
- [ ] Smoke test de las edge functions (`supabase functions serve` requiere Docker).