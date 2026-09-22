import { create } from 'zustand'
import type { ItineraryView } from '@/lib/data/types'
import { repo } from '@/lib/data'

interface ItineraryState {
  loadedTrip: string | null
  view: ItineraryView
  load: (tripId: string, force?: boolean) => Promise<void>
  add: (tripId: string, ideaId: string, dayNumber: number) => Promise<void>
  remove: (itemId: string) => Promise<void>
  move: (itemId: string, dayNumber: number, sortOrder: number) => Promise<void>
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  loadedTrip: null,
  view: { days: [] },

  load: async (tripId, force = false) => {
    if (!force && get().loadedTrip === tripId && get().view.days.length) return
    const view = await repo().listItinerary(tripId)
    set({ view, loadedTrip: tripId })
  },

  add: async (tripId, ideaId, dayNumber) => {
    const item = await repo().addToItinerary(tripId, ideaId, dayNumber)
    await get().load(tripId, true)
    void item
  },

  remove: async (itemId) => {
    await repo().removeFromItinerary(itemId)
    const tripId = get().loadedTrip
    if (tripId) await get().load(tripId, true)
  },

  move: async (itemId, dayNumber, sortOrder) => {
    await repo().moveItineraryItem(itemId, dayNumber, sortOrder)
    const tripId = get().loadedTrip
    if (tripId) await get().load(tripId, true)
  },
}))