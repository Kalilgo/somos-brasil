import { create } from 'zustand'
import type { ItineraryView } from '@/lib/data'
import { repo } from '@/lib/data'
import { toastError } from '@/lib/state/toasts'
import { isStale } from '@/lib/utils/freshness'

interface ItineraryState {
  loadedTrip: string | null
  loadedAt: number
  view: ItineraryView
  load: (tripId: string, force?: boolean) => Promise<void>
  add: (tripId: string, ideaId: string, dayNumber: number) => Promise<void>
  remove: (itemId: string) => Promise<void>
  move: (itemId: string, dayNumber: number, sortOrder: number) => Promise<void>
}

const inFlight = new Map<string, Promise<void>>()

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  loadedTrip: null,
  loadedAt: 0,
  view: { days: [] },

  // `load` nunca rechaza: si la red falla avisamos con un toast y mantenemos
  // lo último que vimos, para no dejar la pantalla en blanco. Después de una
  // mutación el refetch tampoco puede hacer fallar la acción.
  load: async (tripId, force = false) => {
    const s = get()
    if (!force && s.loadedTrip === tripId && s.view.days.length && !isStale(s.loadedAt)) return
    const pending = inFlight.get(tripId)
    if (pending && !force) return pending

    const run = (async () => {
      try {
        const view = await repo().listItinerary(tripId)
        set({ view, loadedTrip: tripId, loadedAt: Date.now() })
      } catch (e) {
        toastError(e instanceof Error ? e.message : 'No pudimos cargar el itinerario')
      }
    })()

    inFlight.set(tripId, run)
    try {
      await run
    } finally {
      inFlight.delete(tripId)
    }
  },

  add: async (tripId, ideaId, dayNumber) => {
    await repo().addToItinerary(tripId, ideaId, dayNumber)
    await get().load(tripId, true)
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
