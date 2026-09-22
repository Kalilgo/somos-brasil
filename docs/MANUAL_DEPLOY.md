# Manual paso a paso: publicar Somos Brasil en internet

Guía para alguien que **no sabe** de git, servidores ni bases de datos. Si seguís los pasos en
orden y copiás/pegás exactamente lo que dice, vas a tener la app corriendo en internet con sus
datos guardados de verdad (no más "modo demo").

> **¿Qué es cada cosa?**
> - **Git / GitHub** = el "carpeta con historial" de tu código, guardado en internet.
> - **Supabase** = la base de datos + funciones del servidor. Es gratis (plan Free).
> - **Vercel** = donde se publica la página (la parte que ves en el navegador). También gratis.

---

## Resumen de lo que hay que hacer

| Paso | Qué | Dónde | Tiempo |
| --- | --- | --- | --- |
| 1 | Subir el código a GitHub | GitHub + terminal | 5 min |
| 2 | Crear y llenar la base de datos | Supabase (página web) | 15 min |
| 3 | Probar en tu computadora con la base real (opcional) | Terminal | 10 min |
| 4 | Publicar la app en internet | Vercel (página web) | 10 min |
| 5 | Verificar que todo funciona | Navegador | 5 min |

**Cuentas que necesitás crear (gratis):**
- GitHub → https://github.com
- Supabase → https://supabase.com (podés entrar con tu cuenta de GitHub, más fácil)
- Vercel → https://vercel.com (también entrás con GitHub)

---

## Paso 1 — Subir el código a GitHub

### 1.1 Crear el repositorio en GitHub

1. Entrá a https://github.com y creá tu cuenta (o entrá si ya tenés).
2. Arriba a la derecha, botón verde **+** → **New repository**.
3. Nombre: escribí `somos-brasil`.
4. Dejalo en **Private** (o Público, es tu decisión).
5. **NO** marques "Add a README", "Add .gitignore" ni "Choose a license". Debe quedar vacío.
6. Botón verde **Create repository**.

> Al terminar vas a ver una página con instrucciones. Necesitás la línea tipo
> `https://github.com/lituusuario/somos-brasil.git` (va a aparecer arriba, se llama "remote URL").

### 1.2 Abrir la terminal y conectarlo

En Mac: abrí **Terminal** (está en Aplicaciones → Utilidades).

Ahora tenés que "ir" a la carpeta del proyecto. Copiá y pegá (después tocá Enter). `~ruta` NO se
escribe así; es la dirección de tu carpeta, por ejemplo `/Users/<tuusuario>/Developer/somos-brasil`.
Si no sabés cuál es, arrastrá la carpeta dentro de la ventana de la terminal y se escribe sola:

```bash
cd ~/ruta/a/somos-brasil
```

Pegá estos tres comandos, uno por uno, tocando Enter después de cada línea:

```bash
git remote add origin https://github.com/lituusuario/somos-brasil.git
git branch -M main
git push -u origin main
```

> ⚠️ **Si te pide usuario y contraseña (token):** cuando pregunte "Username" poné tu usuario de
> GitHub. Cuando pida "Password" **no** es tu contraseña: creá un *token* así:
> GitHub → foto de perfil → **Settings** → **Developer settings** (abajo de todo) →
> **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)** →
> nombre: `somos-brasil`, tildá la casilla `repo` → **Generate token** → copiá el código que
> aparece (empieza con `ghp_...`) y pegalo como "password".

### Validación

En GitHub, el repo `somos-brasil` ahora tiene todos los archivos del proyecto. ✔

Si en algún momento quisieras ver qué archivos cambiaron en tu copia local:

```bash
git status
```

---

## Paso 2 — Crear y llenar la base de datos (Supabase)

### 2.1 Crear el proyecto

1. Entrá a https://supabase.com y creá la cuenta (más fácil: "Continue with GitHub").
2. Botón **New project**.
3. **Name**: `somos-brasil`.
4. **Database Password**: generá una (botón de ojito/dado) y **guardala en tu gestor de
   contraseñas** — se usa una sola vez acá.
5. **Region**: elegí `South America (São Paulo)` para que ande rápido en Argentina.
6. **Pricing plan**: **Free**.
7. Aceptá y esperá. Cuando el proyecto esté creado te lleva a su **Dashboard**, con una URL tipo
   `https://voqebcdbrtkzqlqrlbo.supabase.co` (esa parte de adelante es tu "project ref").

### 2.2 Aplicar las "migraciones" (crean las tablas y cargan los datos demo)

Las migraciones son las recetas de tu base de datos, ya escritas en este proyecto. Hay que
ejecutarlas **en orden**, del archivo 0001 al 0005.

1. En el Dashboard, menú izquierdo → **SQL Editor** → botón **New query**.
2. Abrí la carpeta del proyecto en tu computadora: `supabase/migrations/`.
3. Copiá el contenido completo de `0001_init_schema.sql` y pegalo en el editor.
4. En el editor, botón **Run**. Deberías ver un mensaje verde tipo "Success. No rows returned".
5. Repetí con cada archivo, **en este orden**:
   - `0002_rls_policies.sql`
   - `0003_seed_users_categories_badges.sql`
   - `0004_seed_demo_trip.sql`
   - `0005_views_and_functions.sql`

> Cada arquivo hace una parte. El 0003-0004 cargan los 6 usuarios (QUEME, FLOR, DOZO, HONGO,
> GONZA, KALIL), categorías, badges y un viaje de ejemplo.

### 2.3 Crear las 3 "edge functions" (funciones del servidor)

1. Menú izquierdo → **Edge Functions** → botón **Create a new function**.
2. Esto hay que hacerlo **3 veces**, una por cada función. Para cada una:

   **Función 1: `calculate-trip-summary`**
   - Name: `calculate-trip-summary`
   - En el editor copiá el contenido de `supabase/functions/calculate-trip-summary/index.ts`
   - Tocá **Deploy**.
   - A la derecha hay un editor de archivos (pestañas). Si no aparece `deno.json`, agregalo como
     archivo nuevo con este contenido exacto:
     ```json
     {
       "imports": {
         "@supabase/functions-js": "jsr:@supabase/functions-js@^2",
         "@supabase/server": "npm:@supabase/server@^1"
       }
     }
     ```
     Y tocá Deploy devuelta.

   **Función 2: `get-leaderboard`** — igual, pero con el contenido de
   `supabase/functions/get-leaderboard/index.ts`.

   **Función 3: `add-to-itinerary`** — igual, con `supabase/functions/add-to-itinerary/index.ts`.

> ⚠️ **Importante:** estas funciones son *públicas* (sin login). Si al crear la función aparece el
> interruptor **"Enforce JWT verification"**, dejalo **desactivado**. Sin esto la app no las puede
> llamar.

### 2.4 Anotar las 2 claves (las vas a usar 2 veces más)

1. Menú izquierdo → **Settings** (sección con la ruedita, abajo de todo) → **API**.
2. Copiá de ahí:
   - **Project URL** (ej: `https://voqebcdbrtkzqlqrlbo.supabase.co`)
   - **anon public key** (empieza con `eyJ...`; es larguísima)

Pegalas en un archivo de notas local (no las compartas con nadie).

---

## Paso 3 — Probar en tu computadora con la base real (opcional, recomendado)

Con esto la app deja de ser "modo demo" y pasa a usar tu Supabase.

1. En la carpeta del proyecto ejecutá (terminal):
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
2. Abrí `apps/web/.env.local` con un editor de texto (Bloc de notas / TextEdit / VS Code) y
   reemplazá:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
   por la Project URL y la anon key del paso 2.4. Guardá.
3. Arrancá la app:
   ```bash
   npm install
   npm run dev
   ```
4. Abrí http://localhost:5173 — vas a ver el selector de usuario estilo Netflix. Elegí uno.
   - Si arriba a la derecha **NO** aparece el cartelito amarillo "Modo demo" → conectó bien. ✔
5. Cerrás la terminal cuando quieras parar la app (Ctrl + C).

---

## Paso 4 — Publicar la app en internet (Vercel)

1. Entrá a https://vercel.com con tu cuenta de GitHub ("Continue with GitHub").
2. Botón **Add New** → **Project**.
3. Elegí el repo **`somos-brasil`** → **Import**.
4. Antes de darle Deploy, configurá lo siguiente en esa pantalla:

   **Framework Preset**: `Vite` (si no aparece, elegí "Other").

   **Build Command**:
   ```
   npm run build
   ```

   **Output Directory**:
   ```
   apps/web/dist
   ```

   **Environment Variables** (botón "Environment Variables", agregar 2):
   | Key | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | la Project URL del paso 2.4 |
   | `VITE_SUPABASE_ANON_KEY` | la anon key del paso 2.4 |

   (En el selector de entorno tildá **Production**.)

5. Botón **Deploy**. Esperá ~1 min hasta que diga listo.
6. Te da una URL tipo `https://somos-brasil-xyz.vercel.app`. Abrila.

---

## Paso 5 — Verificar de punta a punta

En la URL de Vercel (y también en `localhost:5173` si hiciste el paso 3):

1. Elegí tu usuario en el selector Netflix. ✔
2. En "Mis viajes" aparece el viaje demo ("Brasil 2026: Carnaval" o similar). ✔
3. Entrá al viaje → pestaña **Ideas** → vota una idea (emoji) y comentá. ✔
4. Confiramos una idea (menú de estado de la card) y mandala al **Itinerario**. ✔
5. Pestaña **Resumen**: aparecen los totales por categoría. ✔
6. Pestaña **Ranking**: aparece el leaderboard con tu burnito de puntos. ✔
7. **Recargá la página**: los datos siguen ahí (ya no se pierden). ✔

> Prueba extra del servidor (edge functions) desde la terminal:
> ```bash
> curl -X POST https://TU-REF.supabase.co/functions/v1/calculate-trip-summary \
>   -H "Content-Type: application/json" \
>   -d '{"trip_id":"00000003-0000-4000-8000-000000000001"}'
> ```
> Debe responder otro JSON con totales (no un error). Reemplazá `TU-REF` por la parte de tu URL
> de proyecto.

---

## Problemas comunes

**"Modo demo" nunca desaparece**
> Falta una de las 2 variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, o están mal
> copiadas. Revisá el paso 2.4 y 4 (en Vercel: abrí el proyecto → Settings → Environment Variables →
> → redeploy con el menú del Deployments → "Redeploy").

**`git push` con error / me pide password**
> Usaste tu contraseña normal de GitHub. Creá un token (ver aviso del paso 1.2) y pegá el `ghp_...`.

**Las migraciones dan error**
> Se ejecutaron en orden y recién después pasaste a la siguiente. Si una falla, la corregiste y le
> diste Run de nuevo. No vuelvas a ejecutar la misma dos veces.

**La edge function responde 404/401**
> Verificá el nombre de la función (tiene que ser exactamente `calculate-trip-summary`,
> `get-leaderboard`, `add-to-itinerary`) y que "Enforce JWT verification" esté desactivado.

**El build de Vercel falla**
> Confirmá que Build Command = `npm run build` y Output Directory = `apps/web/dist`.

**Perdí el password de la base de datos**
> Dashboard → Settings → Database → Reset database password. (Solo para proyectos donde no importe
> perder datos.)

---

## No romper nada (buenas prácticas)

- Cuando cambies el código en tu computadora y quieras subir los cambios:
  ```bash
  git add .
  git commit -m "qué cambió"
  git push
  ```
  Vercel vuelve a publicar automáticamente. Para cambiar las tablas, agregá una nueva migración
  `0006_siguiente.sql` (nunca edites las anteriores si ya están subidas).
- Si querés navegar los datos: Dashboard → **Table Editor** → ver las tablas.