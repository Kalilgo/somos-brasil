import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfigured, supabaseUrl as url, supabaseAnonKey as anonKey } from './env'

export { supabaseConfigured }

let cached: Promise<SupabaseClient> | null = null

/**
 * El cliente se carga con `import()` dinamico a proposito: son ~100KB gzip
 * (supabase-js + auth-js) y tirarlos en el grafo inicial los ponia en el
 * modulepreload del index.html, con la pantalla en blanco hasta que los 214KB
 * de critical path bajaban. Asi el shell pinta al toque y Supabase llega en
 * paralelo, parado por la primera query.
 *
 * Que la URL venga de `env.ts` y no de `import.meta.env` directo es a proposito:
 * ese modulo valida que no estemos pegados a produccion sin querer, y para que la
 * validacion corra siempre, incluso en el camino que no termina creando cliente.
 *
 * El `import type` de arriba no cuesta nada: los type imports se borran al
 * compilar.
 */
export function supabase(): Promise<SupabaseClient> {
  if (!url || !anonKey) {
    return Promise.reject(
      new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Configuralas en apps/web/.env'),
    )
  }
  if (!cached) {
    cached = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    )
  }
  return cached
}

// El JWT custom de sesión NO va como header global: PostgREST lo rechaza por
// ser de otro secreto (401 en las lecturas). Las lecturas son públicas vía
// RLS y las escrituras envían el Bearer explícitamente a member-actions.
// setSessionToken solo invalida el cliente cacheado al cambiar de sesión.
export function setSessionToken(_token: string | null): void {
  cached = null
}
