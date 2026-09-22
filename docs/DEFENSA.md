# Sistema de defensa (anti-bots / anti-abuso)

Protección por capas para el proyecto Supabase. Todo lo que acá se describe ya está
implementado en el código (migraciones 0012/0013, edge functions `login` y
`member-actions`) o hay que activarlo a mano desde el dashboard de Supabase (Fase 0).

---

## Modelo de amenazas

1. **Borrado/vandalismo**: lo peor de todo. La anon key viaja en el bundle del frontend;
   hoy cualquiera que abra la URL pública podía `DELETE` cualquier fila. (Se cerró: RLS
   quedo en solo lectura para anon/authenticated, ver migración 0012.)
2. **Suplantación**: el `user_id` viajaba desde el cliente. Ahora la identidad sale de un
   JWT firmado emitido por el servidor tras validar el PIN del grupo (`app_user_id` claim).
3. **Spam / costo**: scripts que crean ideas/comentarios/votos por miles o pegan a las
   edge functions. Se limitó con rate limiting por IP y por usuario (migración 0013).
4. **Bloat de filas**: textos sin tope. Se agregaron límites de longitud por columna.

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

## Fase 0/1 — Lo que hay que hacer a mano

- [ ] Dashboard: rate limits + CORS + desactivar Auth/Storage/GraphQL.
- [ ] Setear `GROUP_PIN` y `JWT_SIGNING_SECRET` (ver arriba).
- [ ] Cambiar el PIN y avisar al grupo cómo entrar (elegir card → escribir PIN).