# Informe de revisión UX mobile — Somos Brasil

**Fecha:** 25 de septiembre de 2026
**Rama:** `feature/legal-privacidad-mobile`

Revisión "profesional" de la experiencia mobile: touch targets, safe areas, navegación,
estados de carga y optimización de peso. Se auditaron pantallas a 320 / 360 / 390 px
(móviles comunes) y se comparó contra las guías WCAG 2.2 (44×44 px) y Apple/Android.

---

## 1. Qué estaba bien (se mantiene)

- Layout mobile-first, contenedor `max-w-5xl` y `min-h-dvh` (sin el bug de la barra de
  direcciones de iOS).
- Safe areas cubiertas en header, bottom nav, contenido, footer de modal y toaster.
- Sin zoom al tocar inputs (inputs de 16px).
- `prefers-reduced-motion` respetado en CSS, Motion y confetti.
- Base sólida de accesibilidad: skip-link, roles ARIA, focus trap, `aria-live`.
- La navegación tiene bottom bar (no menú hamburguesa), lo cual es lo correcto para pulgar.

## 2. Qué se arregló en esta rama (por pantalla)

### 2.1 Bottom navigation (navegación principal)
- **Antes:** los labels se truncaban ("Itinerario" → "Itinerari…") en pantallas de 320–375 px;
  sin affordance visual de la sección activa; target ajustado (~50 px).
- **Ahora:**
  - Píldora animada detrás del ítem activo (`layoutId` compartido con el sistema de tabs de
    escritorio) — mismo "gesto" visual que desktop.
  - Labels a 11 px con `truncate` como resguardo, y el ítem activo en tinta fuerte.
  - Área táctil completa de cada ítem (alto total ~52 px), cumpliendo el mínimo de 44 px.

### 2.2 Touch targets < 44 px
- Itinerario: botones ↑ / ↓ / ✕ por ítem pasaron de 40 px → **44 px** (`h-11 w-11`).
- Toaster: botón ✕ pasó de 32 px → **44 px**. Además se capó la pila a 3 toasts y se agregó
  `role="alert"`/`status` + `aria-atomic` según haya errores.
- UpdateBanner: botones "Actualizar" y ✕ → **44 px** y posición con `env(safe-area-inset-bottom)`.

### 2.3 Safe areas faltantes
- UpdateBanner: ahora usa `env(safe-area-inset-bottom)`.
- Pantalla de ingreso (`/`): la grilla central ya no queda bajo el gestor de inicio (padding de
  safe area en main y footer).
- Modal sin `footer`: el body ahora respeta el bottom safe area.

### 2.4 Estados de carga
- Comentarios: ya no "aparecen" de golpe (`return null`); ahora muestran un **skeleton** con
  altura reservada (cero layout shift).

### 2.5 Peso y performance
- Fondo de la pantalla de ingreso: **1.05 MB → 255 KB** (~75% menos) re-comprimiendo el JPEG
  (1408×768, calidad 48). Se mantiene como JPEG first-party (no se requieren librerías de
  conversión a WebP en el entorno y no se añaden tools externos).

### 2.6 Texto pequeño
- `ReactionPicker`: badges ✓ y contador "+N" de 10 px → **11 px** (legibilidad en pantallas de
  alta densidad).

### 2.7 Locale consistente
- `formatShortDate` usaba `es` y el resto `es-AR`; ahora todo el formateo es `es-AR`.

## 3. Mejoras distintivas aplicadas

- **Identidad visual del bottom nav**: píldora animada que "fluye" entre secciones, coherente
  con la pill de los tabs en desktop (mismo `layoutId="bottom-nav-pill"` / `tab-pill`).
- **Modo standalone iOS/PWA**: metas `apple-mobile-web-app-capable`, `mobile-web-app-capable`,
  `apple-mobile-web-app-title` y `apple-mobile-web-app-status-bar-style` en `index.html`.

## 4. Pendientes recomendados (no tocados para no ampliar el riesgo)

| Prioridad | Tema | Sugerencia |
| --- | --- | --- |
| Alta | Cabecera en mobile sin contexto | En flujos profundos no hay "atrás" propio del navegador visible; evaluar un botón de retroceso contextual en AppHeader dentro de viajes |
| Alta | Itinerario: 4 controles por ítem | Migrar a bottom sheet de acciones o drag-and-drop (el store ya soporta `move`) |
| Media | Análisis de ítems: `Button size="sm"` sigue en 32 px | Cambiar los `size="sm"` de uso frecuente a 44 px o ampliar paddings |
| Media | Ranking podium apilado en mobile | Revisar solapamiento corona/medalla en 320 px |
| Media | Skeleton global de listas | `LoadingState` a pantalla completa genera salto; reemplazar por skeletons de grilla en TripsHome/IdeasFeed (UserSelector ya lo hace bien) |
| Baja | Gradientes del body en mobile | `background-attachment: scroll` repinta en scroll en gama baja; evaluar fijar en mobile o reducir capas |
| Baja | `MemberDates` ubicación con `truncate` sin `title` | Agregar `title`/expand |
| Baja | Duplicación de estilos `TripCard` vs `Card` | Reutilizar componente |

## 5. Verificación

- `npm run typecheck`, `npm run lint` y `npm run build` pasan en esta rama.
- Se recomienda probar en el preview de Vercel con DevTools en modo dispositivo (390 y 320 px,
  iPhone SE / Pixel 7) y con "Agregar a pantalla de inicio" en iOS/Android.