import { create } from 'zustand'
import type { AppUser, Category, Trip } from '@/types/db'
import { repo } from '@/lib/data'
import type { CreateTripInput } from '@/lib/data/types'

interface TripsState {
  trips: Trip[]
  categories: Category[]
  currentTrip: Trip | null
  membersByTrip: Record<string, AppUser[]>
  loadingTrips: boolean
  loadingTripId: string | null
  refreshTrips: () => Promise<void>
  loadTrip: (tripId: string) => Promise<Trip | null>
  loadMembers: (tripId: string) => Promise<AppUser[]>
  loadCategories: () => Promise<Category[]>
  createTrip: (input: CreateTripInput) => Promise<Trip>
  updateTrip: (tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) => Promise<Trip>
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  categories: [],
  currentTrip: null,
  membersByTrip: {},
  loadingTrips: false,
  loadingTripId: null,

  refreshTrips: async () => {
    set({ loadingTrips: true })
    try {
      const trips = await repo().listTrips()
      set({ trips })
    } finally {
      set({ loadingTrips: false })
    }
  },

  loadTrip: async (tripId) => {
    set({ loadingTripId: tripId })
    try {
      const trip = await repo().getTrip(tripId)
      set({ currentTrip: trip })
      return trip
    } finally {
      set({ loadingTripId: null })
    }
  },

  loadMembers: async (tripId) => {
    const cached = get().membersByTrip[tripId]
    if (cached) return cached
    const members = await repo().getTripMembers(tripId)
    set((s) => ({ membersByTrip: { ...s.membersByTrip, [tripId]: members } }))
    return members
  },

  loadCategories: async () => {
    if (get().categories.length) return get().categories
    const categories = await repo().listCategories()
    set({ categories })
    return categories
  },

  createTrip: async (input) => {
    const trip = await repo().createTrip(input)
    set((s) => ({ trips: [trip, ...s.trips] }))
    return trip
  },

  updateTrip: async (tripId, patch) => {
    const trip = await repo().updateTrip(tripId, patch)
    set((s) => ({
      trips: s.trips.map((t) => (t.id === tripId ? trip : t)),
      currentTrip: s.currentTrip?.id === tripId ? trip : s.currentTrip,
    }))
    return trip
  },
}))