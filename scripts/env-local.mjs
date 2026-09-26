#!/usr/bin/env node
/**
 * Conecta la app con el Supabase local sin copiar y pegar claves a mano.
 *
 *   npm run db:start      (levanta la base local en Docker)
 *   npm run env:local     (escribe apps/web/.env.development con la URL y las claves)
 *   npm run fn:local      (sirve las edge functions con los secretos de desarrollo)
 *
 * Lee la salida de `supabase status` en vez de hardcodear claves: las del stack
 * local se generan por proyecto, asi que no hay una clave "de ejemplo" que valga.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function status() {
  for (const args of [['status', '-o', 'env'], ['status']]) {
    try {
      return execFileSync('supabase', args, { encoding: 'utf8', cwd: root })
    } catch {
      /* probamos el siguiente */
    }
  }
  console.error(
    [
      '',
      '  No pude hablar con el stack local. Probablemente no este corriendo.',
      '',
      '    npm run db:start',
      '',
      '  (necesita Docker; si no lo tenes, instalalo con Docker Desktop)',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

const out = status()

/**
 * `supabase status -o env` imprime KEY=value y trae todo, incluido el JWT_SECRET,
 * que la tabla con recuadros ya no muestra. Es el parseo que corresponde.
 *
 * Los nombres de las claves cambiaron a mitad de camino: la CLI 2.117+ usa
 * PUBLISHABLE_KEY / SECRET_KEY donde antes era ANON_KEY / SERVICE_ROLE_KEY. Se
 * aceptan los dos nombres.
 */
function field(...names) {
  for (const name of names) {
    const m = out.match(new RegExp(`^${name}=(.+)$`, 'm'))
    const value = m?.[1]?.trim()
    // `-o env` entrecomilla los valores para que el shell no los interprete.
    if (value) return value.replace(/^["']|["']$/g, '')
  }
  return undefined
}

const apiUrl = field('API_URL')
const anonKey = field('PUBLISHABLE_KEY', 'ANON_KEY')
const serviceKey = field('SECRET_KEY', 'SERVICE_ROLE_KEY')
const jwtSecret = field('JWT_SECRET')
const linkedRef = field('LINKED_PROJECT_REF')

if (!apiUrl || !anonKey) {
  console.error(
    [
      '',
      '  La salida de `supabase status` no tiene la API URL o el anon key.',
      '',
      '  Si el proyecto esta desactualizado, actualiza la CLI:',
      '    npm i -g supabase@latest',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

const envPath = resolve(root, 'apps/web/.env.development')
writeFileSync(
  envPath,
  [
    '# Generado por `npm run env:local`. No editar a mano, se sobreescribe.',
    '# Datos del stack LOCAL de Supabase. Nada de esto sale de tu maquina.',
    `VITE_DATA_ENV=local`,
    `VITE_SUPABASE_URL=${apiUrl}`,
    `VITE_SUPABASE_ANON_KEY=${anonKey}`,
    '',
  ].join('\n'),
)

// Secretos de las edge functions servidas localmente. El stack local corre en
// modo develop, asi que sin esto cada llamada a member-actions seria un 500.
const fnEnvPath = resolve(root, 'supabase/functions/.env')
if (!existsSync(fnEnvPath)) {
  writeFileSync(
    fnEnvPath,
    [
      '# Secretos de DESARROLLO. Generado por `npm run env:local`.',
      '# Estos valores son los del stack local: no sirven para nada fuera de tu maquina.',
      '# Para produccion, `supabase secrets set` (ver docs/DEFENSA.md).',
      `JWT_SIGNING_SECRET=${jwtSecret ?? ''}`,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceKey ?? ''}`,
      `GROUP_PIN=1234`,
      '',
    ].join('\n'),
  )
  console.log('  · supabase/functions/.env creado con secretos de desarrollo (PIN 1234)')
} else {
  console.log('  · supabase/functions/.env ya existia, no se toco')
}

// El .env de Vite gana sobre el .env de la app solo si el directorio del proyecto
// no tiene el suyo; este recordatorio evita el Classic "no cambia nada".
const rootEnv = resolve(root, 'apps/web/.env')
if (existsSync(rootEnv)) {
  const hasSupabase = /^VITE_SUPABASE_URL=/m.test(readFileSync(rootEnv, 'utf8'))
  if (hasSupabase) {
    console.warn(
      [
        '',
        '  OJO: apps/web/.env tambien define VITE_SUPABASE_URL, y ese archivo tiene',
        '  mas prioridad que .env.development. Es el que te va a ganar.',
        '',
        '    rm apps/web/.env   (o borrale la linea VITE_SUPABASE_URL)',
        '',
      ].join('\n'),
    )
  }
}

const studioUrl = field('STUDIO_URL') ?? apiUrl.replace(':54321', ':54323')
const mailUrl = field('MAILPIT_URL', 'INBUCKET_URL') ?? apiUrl.replace(':54321', ':54324')

if (linkedRef) {
  console.warn(
    [
      '',
      `  OJO: el stack local esta enlazado al proyecto de Supabase ${linkedRef}.`,
      '  Eso no afecta a `npm run dev`, que ya va al 127.0.0.1, pero si un dia',
      '  corres `supabase db push` o `npm run fn:deploy` SIN querer, esos comandos',
      '  NO van a la base local: van a produccion.',
      '',
      '    supabase unlink      # deja de estar enlazado a produccion',
      '',
    ].join('\n'),
  )
}

console.log(`
  Listo. La app va a pegarle al stack local:

    API     ${apiUrl}
    Studio  ${studioUrl}      (SQL editor, para probar migraciones a mano)
    Correo  ${mailUrl}        (los emails de auth caen acá, no salen)

  Arranca con:  npm run dev
  PIN de prueba: 1234
`)
