import { create } from 'zustand'
import type { LeaderboardResult } from '@/lib/data/types'
import { repo } from '@/lib/data'

interface LeaderboardState {
  tripId: string | null
  result: LeaderboardResult | null
  loading: boolean
  load: (tripId: string, force?: boolean) => Promise<void>
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  tripId: null,
  result: null,
  loading: false,

  load: async (tripId, force = false) => {
    if (!force && get().tripId === tripId && get().result) return
    set({ loading: true, tripId })
    try {
      const result = await repo().getLeaderboard(tripId)
      set({ result })
    } finally {
      set({ loading: false })
    }
  },
}))