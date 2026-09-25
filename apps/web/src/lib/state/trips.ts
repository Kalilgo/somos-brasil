import { create } from 'zustand'
import type { AppUser, Category, Trip } from '@/types/db'
import { repo } from '@/lib/data'
import type { CreateTripInput, MemberPlan, SetMemberPlanInput } from '@/lib/data/types'
import { isStale } from '@/lib/utils/freshness'

interface TripsState {
  trips: Trip[]
  categories: Category[]
  currentTrip: Trip | null
  membersByTrip: Record<string, AppUser[]>
  memberPlansByTrip: Record<string, MemberPlan[]>
  membersAt: Record<string, number>
  plansAt: Record<string, number>
  loadingTrips: boolean
  loadingTripId: string | null
  refreshTrips: (force?: boolean) => Promise<void>
  loadTrip: (tripId: string) => Promise<Trip | null>
  loadMembers: (tripId: string) => Promise<AppUser[]>
  loadCategories: () => Promise<Category[]>
  loadMemberPlans: (tripId: string) => Promise<MemberPlan[]>
  saveMemberPlan: (tripId: string, userId: string, input: SetMemberPlanInput) => Promise<MemberPlan>
  createTrip: (input: CreateTripInput) => Promise<Trip>
  updateTrip: (tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) => Promise<Trip>
}

const inFlight = {
  members: new Map<string, Promise<AppUser[]>>(),
  plans: new Map<string, Promise<MemberPlan[]>>(),
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  categories: [],
  currentTrip: null,
  membersByTrip: {},
  memberPlansByTrip: {},
  membersAt: {},
  plansAt: {},
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
    const s = get()
    const cached = s.membersByTrip[tripId]
    if (cached && !isStale(s.membersAt[tripId] ?? 0)) return cached
    const pending = inFlight.members.get(tripId)
    if (pending) return pending
    const run = (async () => {
      const members = await repo().getTripMembers(tripId)
      set((st) => ({
        membersByTrip: { ...st.membersByTrip, [tripId]: members },
        membersAt: { ...st.membersAt, [tripId]: Date.now() },
      }))
      return members
    })()
    inFlight.members.set(tripId, run)
    try {
      return await run
    } finally {
      inFlight.members.delete(tripId)
    }
  },

  loadMemberPlans: async (tripId) => {
    const s = get()
    const cached = s.memberPlansByTrip[tripId]
    if (cached && !isStale(s.plansAt[tripId] ?? 0)) return cached
    const pending = inFlight.plans.get(tripId)
    if (pending) return pending
    const run = (async () => {
      const plans = await repo().listMemberPlans(tripId)
      set((st) => ({
        memberPlansByTrip: { ...st.memberPlansByTrip, [tripId]: plans },
        plansAt: { ...st.plansAt, [tripId]: Date.now() },
      }))
      return plans
    })()
    inFlight.plans.set(tripId, run)
    try {
      return await run
    } finally {
      inFlight.plans.delete(tripId)
    }
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