import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser } from '@/types/db'
import { STORAGE_KEYS } from '@/lib/utils/constants'

interface AuthState {
  currentUser: AppUser | null
  setCurrentUser: (user: AppUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    { name: STORAGE_KEYS.user },
  ),
)