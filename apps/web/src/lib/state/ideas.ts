import { create } from 'zustand'
import type { IdeaStatus, IdeaWithRelations, Reaction } from '@/types/db'
import { repo } from '@/lib/data'
import type { CreateIdeaInput } from '@/lib/data/types'
import { useAuthStore } from '@/lib/state/auth'
import { toastError } from '@/lib/state/toasts'
import { isStale } from '@/lib/utils/freshness'

export type SortKey = 'recent' | 'price_asc' | 'price_desc' | 'votes'

export interface IdeasFilters {
  category: string
  status: string
  sort: SortKey
}

interface IdeasState {
  loadedTrip: string | null
  loadedAt: number
  ideas: IdeaWithRelations[]
  loading: boolean
  filters: IdeasFilters
  setFilter: (patch: Partial<IdeasFilters>) => void
  loadIdeas: (tripId: string, force?: boolean) => Promise<void>
  addIdea: (input: CreateIdeaInput) => Promise<IdeaWithRelations | null>
  changeStatus: (ideaId: string, status: IdeaStatus) => Promise<void>
  removeIdea: (ideaId: string) => Promise<void>
  toggleVote: (ideaId: string, reaction: Reaction) => Promise<void>
  bumpCommentsCount: (ideaId: string, delta: number) => void
}

// Si tres pantallas piden las ideas del mismo viaje a la vez, sale una sola
// request: sin esto se disparan ráfagas duplicadas al entrar al viaje.
const inFlight = new Map<string, Promise<void>>()

export const useIdeasStore = create<IdeasState>((set, get) => ({
  loadedTrip: null,
  loadedAt: 0,
  ideas: [],
  loading: false,
  filters: { category: 'all', status: 'all', sort: 'recent' },

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  loadIdeas: async (tripId, force = false) => {
    const s = get()
    if (!force && s.loadedTrip === tripId && s.ideas.length && !isStale(s.loadedAt)) return
    const pending = inFlight.get(tripId)
    if (pending && !force) return pending

    const run = (async () => {
      set({ loading: true })
      try {
        const ideas = await repo().listIdeas(tripId)
        set({ ideas, loadedTrip: tripId, loadedAt: Date.now() })
      } catch (e) {
        // No conviene romper la pantalla: avisamos y mantenemos lo último que vimos.
        toastError(e instanceof Error ? e.message : 'No pudimos actualizar las ideas')
      } finally {
        set({ loading: false })
      }
    })()

    inFlight.set(tripId, run)
    try {
      await run
    } finally {
      inFlight.delete(tripId)
    }
  },

  addIdea: async (input) => {
    const idea = await repo().createIdea(input)
    set((s) => ({ ideas: [idea as IdeaWithRelations, ...s.ideas] }))
    const list = await repo().listIdeas(input.trip_id)
    const full = list.find((i) => i.id === idea.id) ?? null
    if (full) set((s) => ({ ideas: s.ideas.map((i) => (i.id === full.id ? full : i)) }))
    return full
  },

  changeStatus: async (ideaId, status) => {
    const prev = get().ideas.find((i) => i.id === ideaId)
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === ideaId ? { ...i, status } : i)) }))
    try {
      await repo().updateIdeaStatus(ideaId, status)
    } catch (e) {
      if (prev) set((s) => ({ ideas: s.ideas.map((i) => (i.id === ideaId ? prev : i)) }))
      throw e
    }
  },

  removeIdea: async (ideaId) => {
    const prev = get().ideas
    set((s) => ({ ideas: s.ideas.filter((i) => i.id !== ideaId) }))
    try {
      await repo().deleteIdea(ideaId)
    } catch (e) {
      set({ ideas: prev })
      throw e
    }
  },

  toggleVote: async (ideaId, reaction) => {
    const idea = get().ideas.find((i) => i.id === ideaId)
    const userId = useAuthStore.getState().currentUser?.id
    if (!idea || !userId) return

    const prevVote = idea.my_vote
    const prevCounts = { ...idea.vote_counts }
    const sameAlready = prevVote === reaction
    const nextVote = sameAlready ? null : reaction

    const optimistic: IdeaWithRelations['vote_counts'] = { ...prevCounts }
    if (prevVote) optimistic[prevVote] -= 1
    if (nextVote) optimistic[nextVote] += 1

    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === ideaId ? { ...i, vote_counts: optimistic, my_vote: nextVote } : i,
      ),
    }))

    try {
      if (nextVote) await repo().upsertVote(ideaId, userId, nextVote)
      else await repo().removeVote(ideaId, userId)
    } catch {
      set((s) => ({
        ideas: s.ideas.map((i) =>
          i.id === ideaId ? { ...i, vote_counts: prevCounts, my_vote: prevVote } : i,
        ),
      }))
    }
  },

  bumpCommentsCount: (ideaId, delta) =>
    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === ideaId ? { ...i, comments_count: Math.max(0, i.comments_count + delta) } : i,
      ),
    })),
}))