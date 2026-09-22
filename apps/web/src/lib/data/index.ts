import { supabaseConfigured } from '@/lib/supabase/client'
import { demoRepo } from './demo'
import { supabaseRepo } from './supabase'
import type { DataRepo } from './types'

export const isDemoMode = !supabaseConfigured

let selected: DataRepo | null = null

export function repo(): DataRepo {
  if (!selected) selected = isDemoMode ? demoRepo() : supabaseRepo()
  return selected
}

export type { DataRepo } from './types'
export * from './types'