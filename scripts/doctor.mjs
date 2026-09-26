#!/usr/bin/env node
/**
 * `npm run doctor` — el flujo de desarrollo, revisado pieza por pieza.
 *
 * Existe porque el estado del stack local se rompe de formas distintas y todas se
 * ven igual desde la app: un error de red, un toast que dice "no se pudo
 * completar", un 401. No se distingue "no tenes Docker" de "te falta correr
 * env:local" de "la tabla no esta migrada". Este script las separa.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEV_URL = 'http://127.0.0.1:54321'
const PROJECTS = { ref: 'qcxxxzkghpacmrzmeqju', name: 'somos-brasil' }

let okCount = 0
const fixes = []

function check(ok, label, detail, fix) {
  if (ok) {
    okCount++
    console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? `  \x1b[2m${detail}\x1b[0m` : ''}`)
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${label}`)
    if (detail) console.log(`    \x1b[2m${detail}\x1b[0m`)
    if (fix) fixes.push(fix)
  }
}

const sh = (cmd, args) => {
  try {
    return { out: execFileSync(cmd, args, { encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }) }
  } catch {
    return { out: '' }
  }
}

async function reachable(url, opts = {}) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch(url, { ...opts, signal: ctrl.signal })
    clearTimeout(t)
    return res
  } catch {
    return null
  }
}

console.log('\n  Estado del flujo de desarrollo local\n')

// ---- 1. Docker ---------------------------------------------------------
const docker = sh('docker', ['info'])
const dockerOk = docker.out.includes('Server:') || docker.out.includes('Containers:')
check(dockerOk, 'Docker corriendo', dockerOk ? '' : 'el daemon no responde')
if (!dockerOk) fixes.push('open -a Docker   # abrir Docker Desktop y esperar el ícono verde')

// ---- 2. Stack local ----------------------------------------------------
const status = sh('supabase', ['status', '-o', 'env'])
const envOut = status.out
const stackUp = envOut.includes('API_URL')
const apiUrl = envOut.match(/^API_URL=["']?(.+?)["']?$/m)?.[1]
const anonKey = envOut.match(/^(?:PUBLISHABLE_KEY|ANON_KEY)=["']?(.+?)["']?$/m)?.[1]
check(
  stackUp,
  'Stack de Supabase local arriba',
  stackUp ? (apiUrl ?? '') : 'no hay ningun proyecto corriendo',
)
if (!stackUp) fixes.push('npm run db:start   # la primera vez baja varios GB')

// ---- 3. Desvinculado de produccion ------------------------------------
const linked = existsSync(resolve(root, 'supabase/.temp/project-ref'))
check(
  !linked,
  'Proyecto desvinculado de produccion',
  linked ? 'los comandos de deploy irian a produccion sin querer' : 'db push y deploy fallan en vez de subir nada',
)
if (linked) fixes.push('supabase unlink   # desvincular (deploy: usá `npm run deploy`)')

// ---- 4. La app apunta a local -----------------------------------------
const devEnvPath = resolve(root, 'apps/web/.env.development')
const devEnv = existsSync(devEnvPath) ? readFileSync(devEnvPath, 'utf8') : ''
const declared = devEnv.match(/^VITE_DATA_ENV=(.+)$/m)?.[1]?.trim()
const devUrl = devEnv.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1]?.trim()
const esLocal = devUrl && /^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0|host\.docker\.internal)/.test(devUrl)

check(
  declared === 'local' && esLocal,
  '.env.development apunta a la base local',
  declared ? `VITE_DATA_ENV=${declared}, ${devUrl ?? 'sin URL'}` : 'el archivo no existe',
)
if (!declared) fixes.push('npm run env:local   # genera .env.development con las claves locales')
else if (!esLocal) fixes.push('npm run env:local   # la URL no es local; el guard va a frenar el arranque')

// El .env plano lo leen dev y build a la vez: si define la URL, gana sobre
// .env.development y rompe el aislamiento en el sentido contrario.
const plainEnvPath = resolve(root, 'apps/web/.env')
check(
  !existsSync(plainEnvPath) || !/^VITE_SUPABASE_URL=/m.test(readFileSync(plainEnvPath, 'utf8')),
  'No hay un .env con VITE_SUPABASE_URL',
  existsSync(plainEnvPath) ? 'ese archivo le gana a .env.development' : '',
)
if (existsSync(plainEnvPath) && /^VITE_SUPABASE_URL=/m.test(readFileSync(plainEnvPath, 'utf8'))) {
  fixes.push('rm apps/web/.env   # si no, le gana a .env.development y el dev termina en produccion')
}

// ---- 5. Secretos de las edge functions --------------------------------
const fnEnvPath = resolve(root, 'supabase/functions/.env')
const fnEnv = existsSync(fnEnvPath) ? readFileSync(fnEnvPath, 'utf8') : ''
const fnVars = ['JWT_SIGNING_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'GROUP_PIN']
const faltantes = fnVars.filter((v) => {
  const val = fnEnv.match(new RegExp(`^${v}=(.+)$`, 'm'))?.[1]
  return !val || val.length < (v === 'GROUP_PIN' ? 1 : 20)
})
check(
  fnVars.every((v) => !faltantes.includes(v)),
  'Secretos de las edge functions',
  faltantes.length ? `faltan o estan vacios: ${faltantes.join(', ')}` : 'los 3 presentes',
)
if (faltantes.length) fixes.push('npm run env:local   # (borra supabase/functions/.env para regenerarlo)')

// ---- 6. La API local responde -----------------------------------------
let apiRes = null
if (anonKey) {
  apiRes = await reachable(`${apiUrl}/rest/v1/users?select=id`, {
    headers: { apikey: anonKey },
  })
}
const apiOk = apiRes?.ok
let userCount = 0
if (apiOk) {
  try {
    const body = await apiRes.json()
    if (Array.isArray(body)) userCount = body.length
  } catch {
    /* da igual */
  }
}
check(apiOk, 'API local responde', apiOk ? `${userCount} usuarios visibles` : `${apiUrl} no contesta`)
if (!apiOk && stackUp) fixes.push('npm run db:start   # el stack esta parcial')

// ---- 7. Las edge functions responden ----------------------------------
const fnRes = await reachable(`${apiUrl}/functions/v1/login`, { method: 'POST', body: '{}' })
const fnOk = fnRes && (fnRes.status === 400 || fnRes.status === 401)
check(
  fnOk,
  'Edge functions servidas',
  fnOk ? 'login y member-actions disponibles' : `HTTP ${fnRes?.status ?? 'sin respuesta'}: no se están sirviendo`,
)
if (!fnOk) fixes.push('npm run fn:local   # en otra terminal, sin esto no se puede escribir')

// ---- 8. Las migraciones estan aplicadas -------------------------------
let tablas = 0
if (apiOk) {
  const f = await reachable(`${apiUrl}/rest/v1/trips?select=id&limit=1`, { headers: { apikey: anonKey } })
  if (f?.ok) tablas = 14
}
check(
  apiOk,
  'Migraciones aplicadas',
  apiOk ? 'tablas accesibles desde la API' : 'no se puede verificar sin API',
)
if (apiOk && !tablas) fixes.push('npm run db:reset   # rehace la base desde las migraciones')

// ---- Resumen -----------------------------------------------------------
console.log('')
if (!fixes.length) {
  console.log('  \x1b[32mTodo listo.\x1b[0m `npm run dev` va a pegarle a la base local.\n')
  console.log(`  ${DEV_URL}/  ·  Studio ${DEV_URL.replace('54321', '54323')}  ·  PIN 1234\n`)
  process.exit(0)
}

console.log(`  \x1b[33m${fixes.length} cosa(s) para arreglar:\x1b[0m\n`)
for (const f of fixes) console.log(`    ${f}`)
console.log('')
process.exit(1)
