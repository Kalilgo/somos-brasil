#!/usr/bin/env node
/**
 * Deploy a PRODUCCION, a proposito.
 *
 * El proyecto esta desvinculado (`supabase unlink`), asi que `supabase db push` a
 * secas falla en vez de subir migraciones a la base real sin querer. Este script es
 * la unica via de vuelta, y pide que escribas el nombre del proyecto antes de
 * tocar nada: una confirmacion de un segundo, pero del lado que duele.
 *
 *   npm run deploy           # migraciones + edge functions
 *   npm run deploy -- db     # solo migraciones
 *   npm run deploy -- fn     # solo edge functions
 */
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'qcxxxzkghpacmrzmeqju'
const SOLO = process.argv[2]
const hacerDb = SOLO !== 'fn'
const hacerFn = SOLO !== 'db'

function run(args, opts = {}) {
  return execFileSync('supabase', args, { stdio: 'inherit', cwd: process.cwd(), ...opts })
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const respuesta = await new Promise((resolve) => {
  // Sin respuesta (Ctrl+D, o stdin cerrado) se cancela: nunca seguimos por default.
  rl.on('close', () => resolve(null))
  rl.question(
    [
      '',
      '  ┌─────────────────────────────────────────────────────────────┐',
      '  │  Vas a modificar PRODUCCION. No la base local.             │',
      `  │  Proyecto: ${PROJECT_REF.padEnd(48)}│`,
      '  └─────────────────────────────────────────────────────────────┘',
      '',
      `  Migraciones: ${hacerDb ? 'si' : 'no'}   Edge functions: ${hacerFn ? 'si' : 'no'}`,
      '',
      '  Escribi el nombre del proyecto para confirmar: ',
    ].join('\n'),
    (r) => resolve(r),
  )
})
rl.close()

if (respuesta?.trim() !== PROJECT_REF) {
  console.log('\n  Cancelado. No se toco nada.\n')
  process.exit(1)
}

console.log('\n  Vinculando con produccion...')
run(['link', '--project-ref', PROJECT_REF])

if (hacerDb) {
  console.log('\n  Aplicando migraciones...')
  run(['db', 'push'])
}

if (hacerFn) {
  console.log('\n  Subiendo edge functions...')
  for (const fn of ['login', 'member-actions', 'get-leaderboard']) {
    console.log(`\n  · ${fn}`)
    run(['functions', 'deploy', fn])
  }
}

console.log(`
  Listo. Para que los secretos nuevos apliquen falta rotarlos si changes algo:
    supabase secrets list
`)
