import { create } from 'zustand'
import type { AppUser, Category, Trip } from '@/types/db'
import { repo } from '@/lib/data'
import type { CreateTripInput, MemberPlan, SetMemberPlanInput } from '@/lib/data/types'

interface TripsState {
  trips: Trip[]
  categories: Category[]
  currentTrip: Trip | null
  membersByTrip: Record<string, AppUser[]>
  memberPlansByTrip: Record<string, MemberPlan[]>
  loadingTrips: boolean
  loadingTripId: string | null
  refreshTrips: () => Promise<void>
  loadTrip: (tripId: string) => Promise<Trip | null>
  loadMembers: (tripId: string) => Promise<AppUser[]>
  loadCategories: () => Promise<Category[]>
  loadMemberPlans: (tripId: string) => Promise<MemberPlan[]>
  saveMemberPlan: (tripId: string, userId: string, input: SetMemberPlanInput) => Promise<MemberPlan>
  createTrip: (input: CreateTripInput) => Promise<Trip>
  updateTrip: (tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) => Promise<Trip>
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  categories: [],
  currentTrip: null,
  membersByTrip: {},
  memberPlansByTrip: {},
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

  loadMemberPlans: async (tripId) => {
    const cached = get().memberPlansByTrip[tripId]
    if (cached) return cached
    const plans = await repo().listMemberPlans(tripId)
    set((s) => ({ memberPlansByTrip: { ...s.memberPlansByTrip, [tripId]: plans } }))
    return plans
  },

  saveMemberPlan: async (tripId, userId, input) => {
    const saved = await repo().setMemberPlan(tripId, userId, input)
    set((s) => {
      const current = s.memberPlansByTrip[tripId] ?? []
      const next = current.map((d) => (d.user_id === userId ? saved : d))
      if (!next.some((d) => d.user_id === userId)) next.push(saved)
      return { memberPlansByTrip: { ...s.memberPlansByTrip, [tripId]: next } }
    })
    return saved
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