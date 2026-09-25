import type { AppUser } from '@/types/db'
import { supabase, setSessionToken } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/state/auth'

export function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
    if (!payload.exp) return true
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// Pide sesión al backend con el PIN del grupo y guarda el token para el usuario.
export async function loginWithPin(user: AppUser, pin: string): Promise<void> {
  const sb = await supabase()
  const { data, error } = await sb.functions.invoke('login', {
    body: { user_id: user.id, pin },
  })
  if (error) {
    const msg = (data as { message?: string } | null)?.message ?? error.message ?? 'No se pudo entrar'
    throw new Error(msg)
  }
  const token = (data as { token?: string }).token
  if (!token) throw new Error('El servidor no devolvió una sesión')
  useAuthStore.getState().setToken(user.id, token)
  setSessionToken(token)
}

// Activa la sesión guardada si sigue viva. Devuelve false si hay que pedir PIN.
export function activateUserToken(userId: string): boolean {
  const token = useAuthStore.getState().tokenFor(userId)
  if (!token || tokenExpired(token)) return false
  setSessionToken(token)
  return true
}

// Token vigente para el usuario activo, o null.
export function activeToken(): string | null {
  const uid = useAuthStore.getState().currentUser?.id
  if (!uid) return null
  const token = useAuthStore.getState().tokenFor(uid)
  return token && !tokenExpired(token) ? token : null
}

export function logoutSession(): void {
  setSessionToken(null)
  useAuthStore.getState().logout()
}