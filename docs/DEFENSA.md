# Sistema de defensa (anti-bots / anti-abuso / anti-vandalismo)

Protección por capas para el proyecto Supabase. Todo lo que acá se describe ya está
implementado en el código (migraciones 0012/0013/**0015/0016**, edge functions `login` y
`member-actions`, `vercel.json`) o hay que activarlo a mano desde el dashboard de
Supabase (Fase 0).

> **La anon key es pública.** Viaja en el bundle que sirve Vercel; cualquiera la lee
> desde las devtools. Todo el análisis de riesgo de este documento parte de ahí. No
> tratarla nunca como un secreto ni como una barrera de seguridad.

---

## Modelo de amenazas

1. **Borrado/vandalismo**: lo peor de todo. La anon key viaja en el bundle del frontend;
   cualquiera que abriera la URL pública podía `DELETE` cualquier fila. (Se cerró: RLS
   en solo lectura para anon/authenticated en la migración 0012, y en 0015 los grants
   pasaron a ser `SELECT` solamente, con default fail-closed para tablas nuevas.)
2. **Suplantación**: el `user_id` viajaba desde el cliente. Ahora la identidad sale de un
   JWT firmado emitido por el servidor tras validar el PIN del grupo (`app_user_id` claim).
3. **Spam / costo**: scripts que crean ideas/comentarios/votos por miles o pegan a las
   edge functions. Se limitó con rate limiting por IP y por usuario (migración 0013).
4. **Bloat de filas**: textos sin tope. Se agregaron límites de longitud por columna.
5. **Borrado cruzado**: con el PIN de cualquiera, cualquier miembro podía borrar las ideas
   de los demás. Ahora `delete_idea` solo lo permite a quien propuso la idea o a quien creó
   el viaje, y el botón ni se muestra si no vas a poder borrarla.
6. **Enumeración de la base**: los 500 devolvían `error.message` de Postgres, que incluye
   nombres de tabla, columnas, constraints y tipos. Ahora se loguea server-side y al
   cliente vuelve un mensaje genérico.
7. **Lectura sin autenticar**: sigue abierta, es la deuda conocida (ver más abajo).

## Fase 0 — Ajustes del dashboard (manual, una vez por proyecto)

Estos NO se pueden tocar por código, hay que hacerlos a mano en
[https://supabase.com/dashboard](https://supabase.com/dashboard)  → proyecto → Settings:

1. **Rate Limits** (Settings → API → Rate limits): activar y ajustar. Sugerido:
   - Reads global: 60 req/min por IP.
   - Writes por path (`POST /rest/v1/ideas`, `/comments`, `/votes`, `/trips`, etc.):
     bloquear o limitar a valores chicos (ya no se usan, la escritura va por edge).
2. **CORS / allowed origins** (Settings → API → Allowed origins): dejar solo
   `https://somos-brasil-web.vercel.app` y `http://localhost:5173`.
3. **Desactivar lo que no se usa**:
   - Auth → disable signups (o desactivar Auth si da la opción).
   - Storage → disablen (no se usa).
   - GraphQL → si la dashboard lo permite, desactivar.
4. **Alerts** (Settings → Alerts / Observability): alertar por volumen de requests,
   CPU y errores 429/500.
5. Revisar `Logs Explorer` semanalmente.

## Fase 1 — Identidad y escrituras (implementado)

Arquitectura:

- **Login** (`POST /functions/v1/login`, pública):
  `{ user_id, pin }`. Valida el **PIN del grupo** (secret `GROUP_PIN`) contra un
  `user_id` existente y emite un **JWT HS256** firmado (secret `JWT_SIGNING_SECRET`)
  con claim `app_user_id`, exp 30 días.
- **member-actions** (`POST /functions/v1/member-actions`, pública de red pero exige
  `Authorization: Bearer <jwt>`):
  verifica el JWT, aplica rate limiting, y ejecuta CADA escritura (trip, idea, voto,
  comentario, estado, itinerario) con la **service role key**, validando negocio y
  forzando `user_id = app_user_id` (imposible escribir como otro).
- **RLS**: anon/authenticated quedan SOLO lectura. La escritura es posible únicamente
  vía edge function (service role, bypasea RLS).
- **Lecturas**: `get-leaderboard` y `calculate-trip-summary` siguen públicas pero con
  rate limit por IP.

### Secrets a setear en Supabase

```bash
supabase secrets set GROUP_PIN='<pin-del-grupo>' JWT_SIGNING_SECRET='<32+ random bytes>'
```

- El PIN lo eligen ustedes y se lo pasan por WhatsApp. NO va en el bundle.
- Si se filtra: `supabase secrets set GROUP_PIN='<nuevo>'` y listo (los JWTs viejos
  siguen válidos hasta expirar; para invalidar cambien también JWT_SIGNING_SECRET).

### Límites actuales (edge, por ventana)

| Bucket | Ventana | Tope |
| --- | --- | --- |
| writes por usuario | 1 min | 30 |
| writes por usuario | 24 h | 800 |
| writes por IP | 1 min | 20 |
| writes por IP | 1 h | 200 |
| writes por IP | 24 h | 2000 |
| crear ideas (por usuario) | 1 h | 15 |
| comentarios (por usuario) | 1 h | 40 |
| votos (por usuario) | 1 h | 120 |
| login (por IP) | 5 min | 30 |
| login (por IP) | 24 h | 120 |
| lectura summary/leaderboard (por IP) | 1 min / 1 h | 30 / 300 |

Sobrepasar el tope devuelve `429`. El frontend muestra "Vas muy rápido..." y se puede
reintentar.

## Fase 2 — Eficiencia y monitoreo (pendiente)

- [ ] Ideas con un solo RPC embedded (idea + categoría + contadores) en vez de ~7 queries.
- [ ] Cache stale-while-revalidate en el cliente (los tabs no recargan todo).
- [ ] Cachear summary/leaderboard con TTL.
- [ ] Revisar logs + alerts periódicamente.

## URLs: qué se valida y por qué

Todo lo que viene de la URL es entrada de usuario, igual que un POST. Se valida en el
borde de la app, una sola vez, y no repetido en cada componente.

**Router** — `tripId` se valida como UUID en `TripLayout`, que es el layout padre de
todas las secciones: es el único lugar por donde pasa, así que un link con un id
inválido (cortado, con typo, de un escaneo de bots) muestra "no encontramos ese viaje"
sin disparar ninguna query. `useTripParams` hace lo mismo para los que lo consumen
desde un modal. Un id que no es UUID contra una columna `uuid` terminaba en un error de
Postgres en vez de un 404.

**Query params** — `estado` y `orden` ya tenían allowlist. `categoria` (un id) ahora se
valida como UUID y `integrante` (un user id) también, con fallback a `all`.

**No hay open redirect**: `navigate()` solo recibe rutas internas, y el único valor
dinámico (`location.state.from` en `UserSelector`) nunca lo setea nadie, así que siempre
cae en `/viajes`.

## Superficie HTTP de la base

Con la anon key se pueden golpear seis endpoints. Dos quedaron cerrados por SQL
(migración 0016, que revoca USAGE sobre el schema, así que siguen cerrados aunque
alguien vuelva a activar la exposición por error):

| Endpoint | Estado |
| --- | --- |
| `/rest/v1/<tabla>` | RLS solo lectura + grants `SELECT` (0015) |
| `/rest/v1/rpc/<fn>` | fuera del alcance de `anon` (0015) |
| `/graphql/v1` | **cerrado** (0016) + ya no está en `schemas` de `config.toml` |
| `/storage/v1` | **cerrado** por SQL (0016); desactivar en el dashboard |
| `/auth/v1` | sin signup en el dashboard (Fase 0) |
| `/functions/v1/*` | públicas por diseño; validan JWT + rate limit |

GraphQL merecía atención aparte: además de ser otro camino de lectura, la
introspección devuelve el mapa completo del schema.

## Fase 0/1 — Lo que hay que hacer a mano

- [ ] Dashboard: rate limits + CORS + desactivar Auth/Storage/GraphQL.
- [ ] Setear `GROUP_PIN` y `JWT_SIGNING_SECRET` (ver arriba).
- [ ] Cambiar el PIN y avisar al grupo cómo entrar (elegir card → escribir PIN).
- [ ] Aplicar las migraciones `0015_endurecimiento.sql` y `0016_superficie_http.sql`:
      `supabase db push` (o pegarlas en el SQL Editor del dashboard).

## Headers HTTP (vercel.json)

Ya están: `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`,
`Permissions-Policy`, `Strict-Transport-Security` y `Content-Security-Policy`.

La CSP es deliberadamente estricta: `script-src 'self'` (sin `unsafe-inline`, sin CDN),
`object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`. `style-src` lleva
`'unsafe-inline'` porque Tailwind y Motion usan estilos inline; los sinks de XSS pasan
por `script-src`, que es el que se cierra. `connect-src` queda limitado a
`https://*.supabase.co` y `wss://*.supabase.co`; `img-src https:` es necesario porque
las ideas pueden traer una `image_url` externa.

## Deuda de seguridad conocida — la lectura sigue abierta

Con la anon key (pública) cualquiera puede **leer** la base entera por el Data API:
RLS tiene `using (true)` en las lecturas. Incluye datos personales: nombres de los
integrantes, fechas de viaje y `location` de cada persona, ideas, votos y comentarios.

**Por qué no se cierra todavía:** RLS necesita saber quién llama, y Postgres no lo
sabe. La identidad vive en un PIN que valida una edge function, no en Supabase Auth, así
que no hay `auth.uid()` y las policies solo pueden ser todo-o-nada. Ya se intentó mandar
el JWT propio como `Authorization` global: PostgREST lo rechaza con 401 porque valida
la firma contra el JWT secret del proyecto, que es otro. En un header custom tampoco,
porque la allow-list de CORS de `withSupabase` es fija.

**Cómo se cierra:** migrando la identidad a Supabase Auth (ADR-005). Cada usuario con su
propio secreto —deja de ser un PIN compartido que compromete a los 6 si se filtra—,
`auth.uid()` funciona, RLS pasa a ser expresivo y las edge functions pueden pasar a
`auth: 'user'`.

**Mitigaciones mientras tanto:** Fase 0 del dashboard (rate limits por IP) y que los
datos que exponen no sean de alto valor. Si alguna vez se guardan documentos, direcciones
exactas o datos de salud, esto deja de ser aceptable.