# Desarrollo local

## La regla

**`npm run dev` nunca habla con la base real.** No por cuidado, por construcción: la app
se niega a arrancar si la URL de Supabase no es local, y sin configuración cae en modo
demo (datos en memoria). Apuntar a producción desde dev requiere `VITE_DATA_ENV=prod`,
o sea una decisión consciente.

El motivo es concreto: `VITE_SUPABASE_URL` en un `.env` es indistinguible entre "mi
máquina" y "producción". Con solo las variables mal puestas, un `npm run dev` borra una
idea de prueba, le cambia el nombre al viaje de otro y se come el rate limit — y como los
errores de escritura salen en un toast, parece un bug de la app y no un accidente de
configuración.

## Los tres ambientes

| | Base | Cómo se conecta | Se pierde al recargar |
| --- | --- | --- | --- |
| `local` | Supabase en Docker, en `127.0.0.1:54321` | `npm run db:start` + `npm run env:local` | no |
| `demo` | ninguna: todo en memoria | no hacés nada | sí |
| `prod` | Supabase alojado | `VITE_DATA_ENV=prod` | no |

`demo` es el fallback: si no hay variables, la app anda igual con datos de ejemplo y no
toca ninguna base. Falla hacia el lado seguro.

## Arranque

```bash
# 1. Una sola vez: instalar el stack local (necesita Docker Desktop o Podman)
npm run db:start

# 2. Conectar la app al stack local (escribe apps/web/.env.development)
npm run env:local

# 3. Las edge functions, en otra terminal
npm run fn:local

# 4. La app
npm run dev
```

`npm run db:start` aplica las migraciones solo, así que la base local arranca con el
schema completo. El PIN de desarrollo es `1234` y los secretos de las functions quedan
en `supabase/functions/.env` (que `env:local` genera; si ya existe no lo toca).

Dashboard del stack local: <http://127.0.0.1:54323>

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | la app (modo `local` si configuraste, `demo` si no) |
| `npm run db:start` | levanta Postgres, Kong, Auth, Storage y Functions en Docker |
| `npm run db:stop` | los baja |
| `npm run db:reset` | tira la base y la re-crea desde las migraciones |
| `npm run db:studio` | abre el SQL editor del stack local |
| `npm run env:local` | regenera `apps/web/.env.development` desde `supabase status` |
| `npm run fn:local` | sirve las edge functions con los secretos de desarrollo |
| `npm run fn:deploy` | **sube** las functions a producción |

## Dónde vive cada variable

Vite elige sus archivos `.env` según el modo, y esta separación es lo que evita que un
archivo termine sirviendo para los dos:

| Archivo | Cuándo se lee | Versionado |
| --- | --- | --- |
| `apps/web/.env.development` | solo `vite` (dev) | no |
| `apps/web/.env.production.local` | solo `vite build` / `preview` | no |
| `apps/web/.env` | dev **y** build | no |
| Vercel (dashboard) | build | — |

Los valores de producción que estaban en `apps/web/.env` viven ahora en
`apps/web/.env.production.local`: `vite build` los sigue leyendo, `npm run dev` ya no.
Si alguna vez los necesitás en otra máquina, el lugar correcto es el dashboard de Vercel,
no un archivo del repo.

**Nunca copies los valores de producción a `apps/web/.env`**: ese archivo lo leen los dos
modos, y es exactamente la trampa de la que veníamos. Para desarrollo usá `npm run env:local`.

## Datos de la base local

Viene de las migraciones, no de un seed aparte: los 6 usuarios de `0004` y el viaje de
ejemplo que `0009` borra. O sea, arrancás con usuarios y sin viaje, que es el estado real
de producción.

`db:reset` es producción en limpio. Si tocaste algo y querés volver,
`npm run db:reset` y seguís: nada de eso tocó producción, que es justamente el punto.

## Secretos

| | Local | Producción |
| --- | --- | --- |
| `JWT_SIGNING_SECRET` | `supabase/functions/.env` | `supabase secrets set` |
| `GROUP_PIN` | `supabase/functions/.env` (1234) | `supabase secrets set` |
| anon key | `apps/web/.env.development` | variable en Vercel |

Las claves del stack local se generan por proyecto, así que no hay una clave de ejemplo
que valga: por eso `env:local` lee `supabase status` en vez de hardcodear nada.
