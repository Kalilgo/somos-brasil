# Plan anti-pausa de Supabase (somos-brasil)

> Objetivo: que el proyecto `qcxxxzkghpacmrzmeqju` **no vuelva a pausarse** por
> inactividad, gastando $0/mes y sin depender de que alguien entre al dashboard.

---

## 1. Cómo funciona la pausa (el problema)

Supabase, en el plan **Free**, pausa automáticamente los proyectos con **poca
actividad durante una ventana de 7 días**. No es "7 días sin abrir la web": es
**7 días sin suficiente actividad de base de datos**.

Puntos clave según la documentación oficial (`supabase.com/docs/guides/platform/free-project-pausing`):

- La inactividad se mide por **queries de usuario** contra la base durante la
  semana. "Unas pocas requests a la base por día suelen alcanzar para que no se
  pause."
- Supabase manda **dos mails**: uno de aviso ~1 semana antes, y otro cuando ya
  se pausó.
- Un proyecto **pausado** deja de responder: la app se cae (login, datos, todo)
  hasta que alguien lo despierta a mano desde el Dashboard (**Resume project**).
- **Ventana de restauración**: el mail que te llegó dice *90 días*, pero la doc
  vigente hoy dice **1 año** para restaurar. Después de eso, el proyecto no se
  puede recuperar (los backups son estáticos y se vencen). Igual: no confiar en
  la ventana, es el último recurso.
- **Plan Pro ($25/mes) no se pausa nunca.** Es la única garantía "de fábrica".

### Por qué nos pasa

Usamos la app **esporádicamente** (el viaje con amigos, cada tanto). Entre uso
y uso pasan más de 7 días sin una sola query real, así que el contador de
inactividad llega a cero y Supabase pausa. El tráfico de la web en Vercel **no
cuenta**: lo que cuenta es que la base reciba queries.

---

## 2. La solución: un "latido" (keep-alive) que hace una query real por día

La idea central es **una query trivial a la base todos los días**. Alcanza con
una sola fila leída: entra como actividad, reinicia la ventana de 7 días y el
proyecto nunca se pausa.

Requisitos del latido para que *de verdad* cuente:

1. Debe **tocar Postgres** (no un simple ping HTTP a la home). Una lectura por
   REST a una tabla existente ejecuta una query real.
2. Debe usar la **anon key** (pública, ya viaja en el bundle de la web). **Nunca**
   la `service_role` en un workflow o monitor externo.
3. Debe correr **al menos 1 vez por día** (margen enorme contra la ventana de 7
   días). Si un día falla, los otros 6 cubren.

Usamos una tabla que `anon` ya puede leer por RLS (verificado en
`supabase/migrations/0002_rls_policies.sql`, ej. `categories`), así no hace falta
tocar el schema:

```
GET https://<ref>.supabase.co/rest/v1/categories?select=id&limit=1
apikey: <anon-key>
Authorization: Bearer <anon-key>
```

---

## 3. Plan recomendado: doble red (A + B)

Ningún mecanismo gratuito es 100% confiable solo. La jugada es **dos latidos
independientes**: si uno se degrada, el otro mantiene vivo el proyecto.

### A. GitHub Actions (vive en este repo)

Un workflow programado que dispara la query todos los días. Ventaja: queda
versionado junto al código, sin cuentas nuevas.

- Archivo propuesto: `.github/workflows/keepalive.yml`
- Secreto de repo: `SUPABASE_ANON_KEY` (y opcionalmente `SUPABASE_URL`, por
  defecto la URL de prod). La anon key no es secreta por diseño, pero igual la
  guardamos como *secret* para no ensuciar el repo.
- Cron diario, con `workflow_dispatch` para probarlo a mano:

```yaml
name: Supabase keep-alive

on:
  schedule:
    - cron: '17 9 * * *'   # todos los días 09:17 UTC
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Latido contra la base
        env:
          URL: https://qcxxxzkghpacmrzmeqju.supabase.co
          ANON: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          code=$(curl -sS -o /dev/null -w '%{http_code}' \
            "$URL/rest/v1/categories?select=id&limit=1" \
            -H "apikey: $ANON" -H "Authorization: Bearer $ANON")
          echo "HTTP $code"
          test "$code" = "200"
```

**Límite conocido:** GitHub **desactiva los workflows `schedule` tras 60 días
sin actividad en el repo**. Como este repo se toca cada tanto, puede pasar.
Por eso existe B.

### B. Monitor externo gratuito (independiente de GitHub)

Un servicio de uptime gratuito que pega la misma URL cada ~12h. No depende de
GitHub ni de que alguien commitee.

- Opciones: **UptimeRobot** (50 monitores gratis), **cron-job.org**,
  **Better Stack** (free tier).
- Config: HTTP(s) monitor GET a
  `https://<ref>.supabase.co/rest/v1/categories?select=id&limit=1`, con headers
  `apikey` y `Authorization: Bearer <anon-key>`, cada 12 horas.
- Costo: $0.

Con A + B, para que se pause tendrían que fallar **los dos** durante 7 días
seguidos, cosa muy improbable.

### C. Red de seguridad: aviso por mail

Aunque falle todo, Supabase manda el mail de aviso ~1 semana antes. Con A+B no
debería llegar nunca, pero queda como alarma final: si llega, entrás al
Dashboard (**genera actividad**) o hacés **Resume project**.

---

## 4. Alternativas (por si A+B no alcanza o cambia el contexto)

| Opción | Costo | Garantía | Comentario |
|---|---|---|---|
| **A + B (recomendada)** | $0 | Muy alta | Dos latidos diarios independientes |
| Solo un latido (A o B) | $0 | Alta | Suficiente si no se degrada |
| **Pro Plan** | $25/mes | Total | Supabase no pausa proyectos pagos |
| Self-hosting (Docker) | VPS ~$5/mes | Total | Mucho mantenimiento; overkill para esto |

No recomendamos `pg_cron` dentro de Supabase para este fin: **si el proyecto ya
está pausado, el cron no corre**, así que no sirve como anti-pausa (la base
tendría que estar despierta para despertarse).

---

## 5. Pasos concretos de implementación

> **Estado actual: el proyecto está PAUSADO.** Verificado el latido contra
> `qcxxxzkghpacmrzmeqju.supabase.co`: el dominio hoy da `NXDOMAIN` (Supabase deja
> de resolver el DNS cuando pausa). **Ningún latido puede despertarlo.** Primero
> hay que resumirlo a mano; recién después el keep-alive mantiene vivo el proyecto.

### Paso 0 — Despertar el proyecto (manual, una sola vez)

1. Dashboard de Supabase → organización → proyecto `somos-brasil`.
2. **Resume project** y confirmar.
3. Esperar a `ACTIVE_HEALTHY` y verificar que el dominio resuelva:

   ```bash
   curl -sS -o /dev/null -w '%{http_code}\n' \
     "https://qcxxxzkghpacmrzmeqju.supabase.co/rest/v1/categories?select=id&limit=1" \
     -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>"
   # tiene que dar 200
   ```

### Paso A — GitHub Actions (HECHO, sin config extra)

- [x] Creado `.github/workflows/keepalive.yml`, cron diario + `workflow_dispatch`.
- [x] Usa la anon key pública por defecto (viaja en el bundle de la web, no es un
      secreto). No hace falta cargar ningún secreto para que funcione.
- [ ] Opcional: si querés rotar la clave, cargá `SUPABASE_ANON_KEY` en
      *Settings → Secrets and variables → Actions*; el workflow la toma sola.
- [ ] Probar a mano (pestaña **Actions → Supabase keep-alive → Run workflow**) y
      confirmar `HTTP 200`.

### Paso B — Monitor externo gratuito (pendiente, lo tenés que crear vos)

No puedo crear cuentas por vos, pero son 2 minutos y es la red que evita el
límite de GitHub (que desactiva `schedule` tras 60 días sin commits):

1. Entrá a **UptimeRobot** (o **cron-job.org**, o **Better Stack** free) y creá
   cuenta.
2. Nuevo monitor **HTTP(s)**, método `GET`:
   - URL: `https://qcxxxzkghpacmrzmeqju.supabase.co/rest/v1/categories?select=id&limit=1`
   - Headers personalizados:
     - `apikey: <anon-key>`
     - `Authorization: Bearer <anon-key>`
   - Intervalo: **12 horas** (o lo mínimo que permita el plan free).
3. Guardalo. Ese monitor, solito, mantiene el proyecto despierto.

### Paso C — Verificación

- [ ] Workflow en verde 3 días seguidos en la pestaña Actions.
- [ ] Monitor externo en estado *Up* con historial.
- [ ] Actividad diaria visible en Dashboard → **Reports → Database**.
- [ ] Prueba definitiva: sigue `ACTIVE_HEALTHY` pasadas 2 semanas sin que nadie
      use la app.

### Verificación (cómo sabemos que funciona)

- El workflow corriendo verde 3 días seguidos en la pestaña Actions.
- El monitor externo en estado *Up*, con historial de ~12h.
- Actividad diaria visible en el Dashboard.
- **Prueba definitiva**: el proyecto sigue `ACTIVE_HEALTHY` pasadas 2 semanas sin
  que nadie use la app.

---

## 6. Riesgos y notas

- **Latido que no toca la base**: si algún día se cambia la URL a un endpoint que
  no consulta Postgres (ej. la home de la web), el latido deja de contar.
  Mantener siempre una query REST/RPC.
- **RLS/permisos**: la query usa `categories` porque `anon` tiene SELECT. Si se
  endurecen policies y esa tabla deja de ser legible, hay que apuntar el latido
  a otra tabla pública o crear una función `heartbeat()`.
- **Rotación de claves**: si rotás la anon key, actualizá el secreto de GitHub y
  el monitor. Los latidos empezarían a dar 401 (pero incluso un 401 contra
  PostgREST suele ejecutar la query de auth; no confiar en eso, corregirlo).
- **No abusar**: una query por día alcanza. No hace falta martillar la base; más
  requests no dan más garantía y ensucian métricas.

---

## Resumen en una línea

Poner **dos latidos diarios** (GitHub Actions + monitor externo gratis) que hagan
una `SELECT` real a la base; si algún día los dos fallan 7 días seguidos, queda
el mail de aviso y el botón *Resume*. Costo total: **$0/mes**.

---

## Estado de implementación

| Pieza | Estado |
|---|---|
| Workflow `.github/workflows/keepalive.yml` | **Hecho** (cron diario + manual) |
| Paso 0: resumir el proyecto (hoy está pausado) | **Pendiente — lo tenés que hacer vos** |
| Paso B: monitor externo (UptimeRobot/cron-job.org) | **Pendiente — lo tenés que crear vos** |
| Verificación | Pendiente, después de resumir |

**Orden correcto:** resumir el proyecto → probar el workflow a mano → crear el
monitor externo.
