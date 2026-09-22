import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)

let cached: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Configuralas en apps/web/.env',
    )
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function supabase(): SupabaseClient {
  if (!cached) cached = getSupabaseClient()
  return cached
}

// El JWT custom de sesión NO va como header global: PostgREST lo rechaza por
// ser de otro secreto (401 en las lecturas). Las lecturas son públicas vía
// RLS y las escrituras envían el Bearer explícitamente a member-actions.
// setSessionToken solo invalida el cliente cacheado al cambiar de sesión.
export function setSessionToken(_token: string | null): void {
  cached = null
}