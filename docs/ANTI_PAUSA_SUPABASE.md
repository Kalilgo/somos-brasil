# Anti-pausa de Supabase (somos-brasil) — siempre activo por $0

> Objetivo: que el proyecto `qcxxxzkghpacmrzmeqju` **nunca deje de funcionar**,
> gastando **$0/mes** y **sin depender de que alguien entre al Dashboard**.
> Estrategia: un latido diario que hace una query real, **con auto-recuperación**
> si el proyecto llegó a pausarse.

---

## 1. Por qué se pausa (el problema)

Supabase, en el plan **Free**, pausa los proyectos con **poca actividad de base de
datos durante 7 días**. No es "7 días sin usar la web": es **7 días sin queries
suficientes**. Doc oficial: `supabase.com/docs/guides/platform/free-project-pausing`.

- "Unas pocas requests a la base por día suelen alcanzar" para no pausarse.
- Un proyecto **pausado deja de resolver su DNS** (`NXDOMAIN`): la app se cae
  (login, datos, todo) hasta despertarlo.
- Supabase manda mail de aviso ~1 semana antes y otro al pausar.
- Ventana para restaurar: **1 año** (el mail viejo decía 90 días; la doc vigente
  dice 1 año). Después, el proyecto no se recupera.
- **Pro ($25/mes) no se pausa nunca.** Es la única garantía paga.

### Por qué nos pasa

Usamos la app esporádicamente (el viaje con amigos, cada tanto). Entre uso y uso
pasan más de 7 días sin queries, el contador llega a cero y Supabase pausa. El
tráfico de la web en Vercel **no cuenta**: lo que cuenta es que la base reciba
queries.

---

## 2. La solución: latido con auto-recuperación

Dos piezas, ambas gratis:

### 2.1 El latido (hace la query)

`scripts/heartbeat.mjs` hace una `SELECT` real contra Postgres vía PostgREST, a
una tabla que `anon` ya puede leer (`categories`, según
`supabase/migrations/0002_rls_policies.sql`). Una sola fila alcanza para contar
como actividad y reiniciar la ventana de 7 días.

```
GET https://qcxxxzkghpacmrzmeqju.supabase.co/rest/v1/categories?select=id&limit=1
apikey: <anon-key> · Authorization: Bearer <anon-key>
```

Usa la **anon key** (pública, ya viaja en el bundle de la web). Nunca la
`service_role`.

### 2.2 El auto-restore (la despierta sola)

Si el latido falla, el script llama a la **Management API** para restaurar el
proyecto:

```
POST https://api.supabase.com/v1/projects/qcxxxzkghpacmrzmeqju/restore
Authorization: Bearer <PAT>
```

Clave: `api.supabase.com` **sí resuelve aunque el proyecto esté pausado**, así
que el auto-restore funciona aun cuando el dominio del proyecto no existe. Luego
hace polling hasta que la base responde.

- Requiere un **PAT** (Personal Access Token) en la variable/secreto
  `SUPABASE_ACCESS_TOKEN`. Sin PAT, igual hace el latido, pero no puede restaurar.
- Permiso necesario del token: `project_admin_write` (se puede crear un token
  fine-grained solo con eso).

> Con esto, si algún día el proyecto se pausa, **el siguiente latido lo despierta
> solo**: no dependés de entrar al Dashboard.

---

## 3. Las 3 capas (defensa en profundidad)

| Capa | Qué hace | Dónde | Costo |
|---|---|---|---|
| **1. GitHub Actions** | Latido + auto-restore, 2×/día | `.github/workflows/keepalive.yml` | $0 |
| **2. Monitor externo** | Ping cada 12h, independiente de GitHub | cron-job.org / UptimeRobot | $0 |
| **3. Aviso por mail** | Supabase avisa ~1 semana antes | (nativo) | $0 |

**Por qué las 3:** GitHub **desactiva los `schedule` tras 60 días sin actividad en
el repo**, y este repo se toca cada tanto. El monitor externo (capa 2) no depende
de GitHub y mantiene el proyecto vivo por sí solo. La capa 1 aporta el
auto-restore. La capa 3 es la alarma final si todo lo demás falla.

---

## 4. Puesta en marcha (paso a paso)

### Paso 0 — Despertar el proyecto (manual, una vez)

> **Ahora mismo el proyecto está PAUSADO** (verificado: `qcxxxzkghpacmrzmeqju.supabase.co`
> da `NXDOMAIN`). Ningún latido puede despertarlo desde cero. Hacelo una vez a
> mano; después el sistema se mantiene solo.

1. Dashboard → organización → proyecto **somos-brasil**.
2. **Resume project** y confirmar.
3. Esperar **ACTIVE_HEALTHY** (1-2 min) y verificar:

   ```bash
   npm run heartbeat          # tiene que decir "Base activa"
   ```

### Paso 1 — Crear el PAT y cargarlo como secreto

1. https://supabase.com/dashboard/account/tokens → **Generate new token**.
   Nombre: `keepalive`. Es un `sbp_...`.
2. En GitHub: repo → *Settings → Secrets and variables → Actions → New repository
   secret* → nombre `SUPABASE_ACCESS_TOKEN`, valor el `sbp_...`.
3. Probar el workflow a mano: pestaña **Actions → Supabase keep-alive → Run
   workflow**. Tiene que terminar verde con `Base activa`.

> Con el PAT configurado, el auto-restore queda activo. Sin él, el workflow sigue
> haciendo el latido pero no puede recuperar un proyecto pausado.

### Paso 2 — Monitor externo (recomendado, 3 min)

Evita el límite de GitHub. Dos opciones:

**cron-job.org** (más flexible):
1. Crear cuenta → **Create cronjob**.
2. URL: `https://qcxxxzkghpacmrzmeqju.supabase.co/rest/v1/categories?select=id&limit=1`
3. *Advanced* → custom headers:
   - `apikey: <anon-key>`
   - `Authorization: Bearer <anon-key>`
4. Schedule: cada **12 horas**.

**UptimeRobot** (te avisa por mail si se cae):
1. Crear cuenta → **Add monitor** → HTTP(s).
2. Misma URL + los mismos headers.
3. Intervalo: 12h (o el mínimo del plan free).

### Paso 3 — Verificación

- [ ] `npm run heartbeat` local dice "Base activa".
- [ ] Workflow verde en la pestaña Actions.
- [ ] Monitor externo en estado *Up* con historial.
- [ ] Actividad en Dashboard → **Reports → Database**.
- [ ] Prueba definitiva: sigue `ACTIVE_HEALTHY` pasados 15 días sin que nadie use
      la app.

---

## 5. Optimización de costos

Todo lo de arriba es gratis y lo más barato posible:

| Recurso | Plan | Límite free | Nuestro uso | Costo |
|---|---|---|---|---|
| Supabase | Free | 500 MB DB, 5 GB egress, 50k MAU, 2 proyectos | 1 proyecto, latidos mínimos | **$0** |
| Hosting web | Vercel Hobby | tier free | — | **$0** |
| GitHub Actions | Free | minutos gratis (repo público: ilimitado) | ~10 s × 2/día | **$0** |
| Monitor externo | Free | 50 monitores / jobs ilimitados | 1 job cada 12h | **$0** |
| **Alternativa Pro** | Pro | — | evita la pausa de fábrica | **$25/mes** |

Decisiones para no gastar:

- **No pasar a Pro ($25/mes):** el latido + auto-restore cubren el 100% del
  beneficio que buscábamos de Pro (no pausarse), por $0.
- **Una query por latido:** más requests no dan más garantía y ensucian métricas
  y egress.
- **Un solo proyecto activo:** el free permite 2; no crear de más.
- **Auto-restore en vez de monitoreo permanente:** solo gasta Management API (60
  req/min de límite) cuando hace falta.

---

## 6. Riesgos y notas

- **Latido que no toca la base:** si se cambia la URL a un endpoint que no consulta
  Postgres (ej. la home de la web), deja de contar. Mantener siempre la query REST.
- **RLS/permisos:** se usa `categories` porque `anon` tiene SELECT. Si se endurecen
  las policies y deja de ser legible, apuntar el latido a otra tabla pública o
  crear una función `heartbeat()`.
- **Rotación de claves:** si rotás la anon key, actualizá el workflow y el monitor.
  Si rotás el PAT, actualizá el secreto `SUPABASE_ACCESS_TOKEN`.
- **GitHub 60 días sin commits:** desactiva los `schedule`. Por eso el monitor
  externo es la pieza crítica; el workflow es el que agrega el auto-restore.
- **Ventana de 1 año:** si el proyecto estuviera pausado > 1 año sin que corriera
  ningún latido, ya no se recupera. Con estas capas no debería pasar nunca.
- **Seguridad del PAT:** el PAT tiene alcance de cuenta. Guardalo solo como
  secreto. Si un cron externo lo usara, preferí crear uno fine-grained con
  `project_admin_write` y poder revocarlo aparte.

---

## 7. Comandos

```bash
npm run heartbeat                                  # latido (y restore si hay PAT)
SUPABASE_ACCESS_TOKEN=sbp_xxx npm run heartbeat    # latido + auto-recuperación
```

---

## Resumen en una línea

`scripts/heartbeat.mjs` corre desde **GitHub Actions 2×/día + un monitor externo
cada 12h**: hace una `SELECT` real para no pausarse y, si igual se pausó, la
**Management API lo despierta solo**. Costo total: **$0/mes**.
