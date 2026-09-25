import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser } from '@/types/db'
import { STORAGE_KEYS } from '@/lib/utils/constants'

interface AuthState {
  currentUser: AppUser | null
  /** Último usuario elegido en este dispositivo: evita pasar por el selector cada vez. */
  lastUserId: string | null
  tokens: Record<string, string>
  setCurrentUser: (user: AppUser) => void
  setToken: (userId: string, token: string) => void
  tokenFor: (userId: string) => string | null
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      lastUserId: null,
      tokens: {},
      setCurrentUser: (user) => set({ currentUser: user, lastUserId: user.id }),
      setToken: (userId, token) =>
        set((s) => ({ tokens: { ...s.tokens, [userId]: token } })),
      tokenFor: (userId) => get().tokens[userId] ?? null,
      logout: () => set({ currentUser: null, lastUserId: null, tokens: {} }),
    }),
    { name: STORAGE_KEYS.user },
  ),
)