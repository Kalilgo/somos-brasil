/**
 * Ambientes de datos: dos (o tres) bases, nunca mezcladas.
 *
 * El problema que resuelve esto: `VITE_SUPABASE_URL` en un `.env` es indistinguible
 * entre "mi maquina" y "produccion". Con solo las variables mal puestas, un
 * `npm run dev` normal-developer contra la base real: borra una idea de prueba,
 * cambia el nombre del viaje de otro, se come el rate limit. Y como los errores
 * de escritura se muestran en un toast, parece un bug de la app, no un
 * accidente de configuracion.
 *
 * Asi que la regla no es "configura bien", es "no se puede configurar mal":
 *
 *   - `npm run dev` (mode=development) solo acepta una URL local.
 *   - apuntar a produccion en dev requiere `VITE_DATA_ENV=prod`, o sea
 *     una decision consciente, no un descuido.
 *   - en `production` (Vercel) el comportamiento es el de siempre.
 *   - sin variables en dev: modo demo, que escribe en localStorage y no toca
 *     ninguna base. Falla hacia el lado seguro.
 */

export type DataEnv = 'demo' | 'local' | 'prod'

const LOCAL_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'host.docker.internal',
  'kong',
]

export function isLocalSupabaseUrl(value: string | undefined): boolean {
  if (!value) return false
  let host: string
  try {
    host = new URL(value).hostname
  } catch {
    return false
  }
  return LOCAL_HOSTS.includes(host) || host.endsWith('.local')
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const declared = import.meta.env.VITE_DATA_ENV as string | undefined

/** `vite` siempre es 'development' con `vite`, y 'production' con `vite build`. */
const isDev = import.meta.env.MODE !== 'production'

function fail(reason: string, fix: readonly string[]): never {
  const lines = [
    '',
    '  ⛔  No se puede arrancar en este ambiente.',
    '',
    `  Motivo: ${reason}`,
    '',
    '  Para arreglarlo:',
    ...fix.map((f) => `    · ${f}`),
    '',
  ]
  throw new Error(lines.join('\n'))
}

function resolveDataEnv(): DataEnv {
  if (declared === 'prod' || declared === 'local' || declared === 'demo') {
    return declared
  }

  if (!isDev) {
    // En el build de Vercel las variables vienen del dashboard. Sin
    // VITE_DATA_ENV declaramos 'prod' si hay URL, y demo si no hay nada.
    return rawUrl ? 'prod' : 'demo'
  }

  if (!rawUrl) {
    // Sin configuracion: modo demo. No toca ninguna base.
    return 'demo'
  }

  if (isLocalSupabaseUrl(rawUrl)) {
    return 'local'
  }

  // Dev con una URL que no es local. Sin esto, un `.env` con las variables de
  // produccion escribe en la base real sin avisar.
  return fail(
    `VITE_SUPABASE_URL apunta a ${rawUrl}, que no es un Supabase local, en modo development.`,
    [
      'Levanta la base local:            npm run db:start',
      'Conectala a la app:              npm run env:local',
      'O, si de verdad querés tocar produccion desde dev, declaralo:',
      '                                  VITE_DATA_ENV=prod  (consciente, no un descuido)',
      'Para trabajar sin base:            VITE_DATA_ENV=demo  (datos en memoria)',
    ],
  )
}

export const dataEnv = resolveDataEnv()

if (dataEnv === 'prod' && !isDev) {
  // En el deploy solo puede ser prod o demo. 'local' en un build de produccion
  // significaria un deploy mal configurado apuntando a la maquina de alguien.
  if (isLocalSupabaseUrl(rawUrl)) {
    fail('El build de produccion esta apuntando a un Supabase local.', [
      'Quita VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY de las variables de Vercel,',
      'o ponelas con la URL real del proyecto.',
    ])
  }
}

const allowRemote = dataEnv === 'prod' && isDev

export const supabaseConfigured = Boolean(rawUrl && rawKey) && dataEnv !== 'demo'

/** La URL efectiva; '' fuerza modo demo sin tocar variables. */
export const supabaseUrl = dataEnv === 'demo' ? '' : (rawUrl ?? '')
export const supabaseAnonKey = dataEnv === 'demo' ? '' : (rawKey ?? '')

/**
 * Aviso en consola. El punto es que en cada recarga quede escrito a que base
 * estas pegado, y no haya que acordarse de nada.
 */
if (supabaseConfigured && dataEnv !== 'demo') {
  const etiqueta =
    dataEnv === 'prod' && isDev ? 'PRODUCCION ⚠' : dataEnv === 'prod' ? 'produccion' : 'local'
  console.info(
    `%c[somos-brasil] base de datos: ${etiqueta} · ${supabaseUrl}`,
    `color:${dataEnv === 'prod' && isDev ? '#dc2626' : '#16a34a'};font-weight:bold`,
  )
  if (allowRemote) {
    console.warn(
      '[somos-brasil] Es development pero apuntás a produccion. Lo que escribas va a la base real.',
    )
  }
}
