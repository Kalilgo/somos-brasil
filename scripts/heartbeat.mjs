#!/usr/bin/env node
/**
 * `npm run heartbeat` — mantiene despierto el proyecto Free de Supabase.
 *
 * El plan Free pausa el proyecto tras 7 dias de poca actividad de base. Este
 * script hace una query real (SELECT) para que eso no pase. Y si lo agarra ya
 * pausado, lo DESPIERTA SOLO: el dominio del proyecto no resuelve cuando esta
 * pausado (NXDOMAIN), pero la Management API vive en api.supabase.com y si
 * resuelve, así que llama a POST /restore y espera a que levante.
 *
 * Uso:
 *   npm run heartbeat                      # solo latido (anon key publica)
 *   SUPABASE_ACCESS_TOKEN=sbp_... npm run heartbeat   # latido + auto-restore
 *
 * En GitHub Actions corre sola (ver .github/workflows/keepalive.yml). El PAT va
 * como secreto SUPABASE_ACCESS_TOKEN. Sin PAT igual hace el latido, pero no puede
 * auto-recuperar. Ver docs/ANTI_PAUSA_SUPABASE.md
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'qcxxxzkghpacmrzmeqju'
const SUPABASE_URL = process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`

// La anon key es publica por diseno: viaja en el bundle de la web. No es un
// secreto; lo que protege los datos es RLS. Igual se puede pisar por env.
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeHh4emtnaHBhY21yem1lcWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzg5NjIsImV4cCI6MjEwNTY1NDk2Mn0.y6IskmRHZ5oE8cD7apfIHyJNYQm8YLajOvZhoHlt9YQ'

// El PAT de la Management API () hace posible el auto-restore. Los PAT
// tienen el alcance de la cuenta: guardalo como secreto, nunca en el repo.
const PAT = process.env.SUPABASE_ACCESS_TOKEN ?? ''
const API = 'https://api.supabase.com/v1'

const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,
}
const log = (s = '') => console.log(s)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function req(url, opts = {}, timeout = 12000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/** Query real contra Postgres via PostgREST. */
async function pingDb() {
  try {
    const res = await req(`${SUPABASE_URL}/rest/v1/categories?select=id&limit=1`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err.message }
  }
}

async function projectStatus() {
  try {
    const res = await req(`${API}/projects/${PROJECT_REF}`, {
      headers: { Authorization: `Bearer ${PAT}` },
    })
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    return body?.status ?? null
  } catch {
    return null
  }
}

async function restore() {
  const res = await req(`${API}/projects/${PROJECT_REF}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}` },
  })
  if (res.ok) return { ok: true }
  const body = await res.text().catch(() => '')
  return { ok: false, status: res.status, body: body.slice(0, 300) }
}

log('\n  Latido de Supabase  ' + c.d(`(${PROJECT_REF})`) + '\n')

// ---- 1. La base responde? ----------------------------------------------
const first = await pingDb()
if (first.ok) {
  log(`  ${c.g('✓')} Base activa  ${c.d(`HTTP ${first.status} · el proyecto sigue despierto`)}\n`)
  process.exit(0)
}

log(`  ${c.y('!')} La base no responde  ${c.d(first.error ?? `HTTP ${first.status}`)}`)

// DNS roto = pausado. Si no hay PAT, no se puede hacer mas que avisar.
if (!PAT) {
  log(`\n  ${c.r('No se puede despertar sin token.')}`)
  log('  Defini SUPABASE_ACCESS_TOKEN (PAT de la Management API) para auto-restore.')
  log(`  O entra al Dashboard y toca "Resume project": ${c.d('https://supabase.com/dashboard/project/' + PROJECT_REF)}\n`)
  process.exit(1)
}

// ---- 2. Auto-restore ----------------------------------------------------
const estado = await projectStatus()
log(`  ${c.d(`Estado del proyecto: ${estado ?? 'desconocido'}`)}`)
log(`  ${c.y('→')} Pidiendo restore a la Management API...`)

const r = await restore()
if (!r.ok) {
  log(`  ${c.r('✗')} Restore fallo  ${c.d(`HTTP ${r.status} ${r.body}`)}`)
  log(`  Revisa que el PAT tenga permiso ${c.d('project_admin_write')}.\n`)
  process.exit(1)
}
log(`  ${c.g('✓')} Restore aceptado. Esperando a que levante (suele tardar 1-2 min)...\n`)

// ---- 3. Poll hasta que responda ----------------------------------------
const intentos = 40
for (let i = 1; i <= intentos; i++) {
  await sleep(15000)
  const p = await pingDb()
  if (p.ok) {
    log(`  ${c.g('✓')} Proyecto despierto de nuevo  ${c.d(`(intento ${i}) · HTTP ${p.status}`)}\n`)
    process.exit(0)
  }
  const s = await projectStatus()
  log(`  ${c.d(`· intento ${i}/${intentos} · ${s ?? 'sin estado'}`)}`)
}

log(`\n  ${c.r('Se pidio el restore pero no respondio a tiempo.')}`)
log(`  Revisa el Dashboard: ${c.d('https://supabase.com/dashboard/project/' + PROJECT_REF)}\n`)
process.exit(1)
