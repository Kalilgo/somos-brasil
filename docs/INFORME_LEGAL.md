# Informe de Cumplimiento Legal y Privacidad — Somos Brasil

**Fecha:** 25 de septiembre de 2026
**Alcance:** aplicación web `apps/web` (Vercel + Supabase), PWA, service worker.
**Rama:** `feature/legal-privacidad-mobile`

> ⚠️ Este informe es una revisión técnica de cumplimiento para un grupo cerrado de personas
> (MVP), NO reemplaza el consejo de un abogado. Antes de abrir la app al público general,
> debería revisarse con un profesional (en particular la Ley Argentina 25.326 y el RGPD/LC)).
> Este documento no reemplaza un dictamen legal.

---

## 1. Resumen ejecutivo

| Tema | Estado de partida | Estado después de esta rama |
| --- | --- | --- |
| Cookies de terceros / publicidad | No hay ninguna ✅ | No hay ninguna ✅ |
| Banner / aviso de privacidad | No existía ❌ | Banner de consentimiento informativo ✅ |
| Políticas (Términos/Privacidad/Cookies) | No existían ❌ | 3 páginas públicas + acceso desde la UI ✅ |
| Datos personales locales | Sin transparencia ni control ❌ | Export + borrado local ("Mis datos") ✅ |
| Derechos ARCO/LGPD/GDPR | Solo en papel ❌ | Parcial: borrado/export local + vía de contacto ✅* |
| Cabeceras de seguridad | Básicas ❌ | Referrer-Policy, nosniff, frame, Permissions-Policy ✅ |
| `robots.txt` | No existía ❌ | Creado (bloquea secciones de viaje) ✅ |
| Documentación de variables | Faltaba `VITE_VAPID_PUBLIC_KEY` ❌ | Agregada al `.env.example` ✅ |
| RLS de lectura abierta (`anon`) | Riesgo alto ⚠️ | **Pendiente** (requiere decisión de negocio) |

\* Derechos "de verdad" sobre datos en el servidor requieren una acción de backend (p. ej. una
edge function `delete_my_data`) que se propone en §9 como siguiente paso. En esta rama quedó la
transparencia + herramienta local + canal de contacto.

---

## 2. Qué datos maneja la app

### 2.1 Datos personales tratados
| Dato | Dónde | Naturaleza |
| --- | --- | --- |
| Identidad del grupo (nombre, emoji, color) | `users` (Supabase) | Identificativo |
| Sesión firmada (JWT, caducidad 30 días) | `localStorage["somos-brasil-user"]` | Identificativo |
| Ideas, votos, reacciones, comentarios | `ideas`, `votes`, `comments` | Generado por el usuario |
| Fechas de vuelo y **ubicación textual** (¿dónde te alojás?) | `trip_members.arrival/departure_date`, `location` | **Potencialmente sensible** |
| Dirección IP (ratelimit) | `rate_limits` (retención ~24–25 h) | Identificativo indirecto |
| Suscripción push (endpoint del navegador + claves) | `push_subscriptions` | Identificativo de dispositivo |

No se piden: email, teléfono, DNI, fecha de nacimiento, fotos reales ni geolocalización GPS.

### 2.2 Almacenamiento en el dispositivo (no hay cookies)
La app **no usa cookies** (`document.cookie` = 0 usos). Usa almacenamiento técnico del navegador:

| Clave | Tipo | Contenido |
| --- | --- | --- |
| `somos-brasil-user` | localStorage | Identidad + JWT de sesión |
| `somos-brasil-consent` | localStorage | Elección del aviso de privacidad *(nueva)* |
| `somos-brasil-demo-db` | localStorage | Base demo completa (solo modo demo) |
| `somos-brasil-push-dismiss` | localStorage | Aviso de push descartado |
| `somos-brasil-update-dismiss` / `somos-brasil-chunk-retry` | sessionStorage | Avisos transitorios |

El service worker precachea *assets* estáticos (JS/CSS/fuentes/imágenes) en Cache API. No cachea
datos de negocio ni requests a Supabase.

### 2.3 Terceros e integraciones
| Tercero | Uso | Nota |
| --- | --- | --- |
| Supabase (`*.supabase.co`) | BD + función de login + `member-actions` | Único backend |
| Vercel | Hosting y CDN | Logs/headers del hosting |
| Proveedores de push (FCM/APNs/Mozilla) | Solo si el usuario activa notificaciones | Endpoint del navegador |
| Imágenes remotas en ideas | Carga `img` con URL libre | Requests a terceros **controlados por el usuario** |

**Punto a favor destacable:** no hay Google Fonts (auto-hosteada), no hay GA/GTM/PostHog/Sentry
ni ningún script de perfilado externo. Las fuentes son `@fontsource` (first-party).

---

## 3. Hallazgos y acciones

### 3.1 Implementado en esta rama
1. **Banner de privacidad** (`Apps ConsentBanner`): aviso informativo sobre datos locales, sin
   cookies de seguimiento, con enlaces a Privacidad y Cookies. persiste la elección en
   `somos-brasil-consent`.
2. **Tres páginas públicas** (`/terminos`, `/privacidad`, `/cookies`):
   - Términos y Condiciones (uso, conducta, responsabilidad, ley AR, jurisdicción CABA).
   - Política de Privacidad (datos, base legal, finalidades, destinatarios, transferencias,
     conservación, derechos ARCO/LGPD/GDPR, menores, seguridad, contacto).
   - Política de Cookies (no hay cookies de terceros; transparencia sobre localStorage).
3. **Acceso a las políticas desde la UI**: menú de usuario (Términos/Privacidad/Cookies) y
   footer de la pantalla de ingreso (`UserSelector`).
4. **"Mis datos"** en el menú de usuario:
   - 📦 **Exportar datos locales** (descarga JSON de claves `somos-brasil-*`).
   - 🗑️ **Borrar datos de este dispositivo** (confirma, limpia localStorage/sessionStorage,
     cierra sesión y recarga).
   - Aviso claro: lo del servidor no se borra con esto; canal de contacto para ARCO.
5. **Cabeceras de seguridad** en `vercel.json` (y en `apps/web/vercel.json`):
   `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`,
   `X-Frame-Options: DENY`, `Permissions-Policy` (camera/mic/geolocation/payment/usb=()).
   (HSTS ya lo emite Vercel.)
6. **`robots.txt`**: permite `/`, deshabilita `/viajes/` (contenido privado).
7. `.env.example` documenta `VITE_VAPID_PUBLIC_KEY`.

### 3.2 Riesgos que requieren decisión del negocio (no código)
| Riesgo | Detalle | Recomendación |
| --- | --- | --- |
| **RLS de lectura abierta** | `read_all` para `anon` en las tablas del grupo: cualquiera con la anon key (que va en el bundle) puede leer viajes, ideas, comentarios, fechas y ubicaciones | Para un grupo cerrado es un riesgo aceptado (ADR-001), pero **no** compatible con abrir la app al público. Antes de publicarla abierta: políticas que requieran sesión válida (`app_user_id` en JWT) incluso para lecturas |
| **JWT en localStorage** | Accesible a XSS en el navegador | No hay flows de terceros; mitigado por `persistSession:false` en Supabase Auth. Sin embargo, idealmente: Content Security Policy + migrar a cookie `httpOnly` en un futuro |
| **Derechos plenos en servidor** | El borrado local no toca datos del grupo en Supabase | Implementar edge function `delete_my_data` (borra/banea por `user_id`) y `export_my_data` (dump) |
| **Ubicación textual** | Datos potencialmente sensibles (dirección de alojamiento) | (a) dividir el campo con picker de ciudad/zona; (b) reforzar el aviso en el form; (c) permitir "no compartir" |
| **Imágenes externas** | `<img>` con URL libre de un integrante carga en el navegador de todos (fuga de IP/referrer/UA a terceros) | Convertir la imagen a proxy propio (`/api/img?url=...`) o exigir protocolo + `referrerpolicy="no-referrer"` en el `<img>` |
| **CSP ausente** | No hay Content-Security-Policy (los estilos inline del bundle la complican) | Trabajo técnico pendiente; documentado |

---

## 4. Cumplimiento normativo (resumen)

- **Argentina — Ley 25.326 / Decreto 1558/2001:** la app debería cumplir principios de licitud,
  finalidad, calidad y seguridad, y garantizar derechos de acceso, rectificación, actualización
  y supresión. Con la rama: transparencia + herramientas locales + canal de contacto. Pendiente:
  ejercicio pleno de los derechos sobre datos en el servidor (§3.2).
- **Brasil — LGPD (Lei 13.709):** relevante si hay integrantes o destino en Brasil. Principios
  de necesidad, base legal y derechos de acesso/correção/portabilidade/eliminação. Misma
  conclusión que la LPD Argentina.
- **RGPD/EPrivacy (referencia, no aplicable directo por residir en AR/BR):** las cookies "estrictamente
  necesarias" no requieren consentimiento; la app no usa cookies no esenciales, lo que la deja
  en posición fuerte.

---

## 5. Pendientes sugeridos (roadmap de privacidad)

1. **(Alto)** Cerrar lecturas de `anon` a autenticados si la app sale del grupo cerrado.
2. **(Alto)** Edge functions `delete_my_data` y `export_my_data` conectadas a la UI ("Mis datos").
3. **(Medio)** `referrerpolicy="no-referrer"` + proxy de imágenes para ideas con URL.
4. **(Medio)** Content Security Policy gradual.
5. **(Medio)** Cambio de clave real para `VITE_VAPID_PUBLIC_KEY` (hoy hay fallback de desarrollo).
6. **(Bajo)** Sustituir los textos `legal@somosbrasil.app` por el canal real del grupo antes de
   publicar la rama.