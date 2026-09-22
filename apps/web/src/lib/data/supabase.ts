import type {
  AppUser,
  Badge,
  Category,
  Idea,
  IdeaComment,
  IdeaStatus,
  Reaction,
  Trip,
  UserBadge,
  Vote,
} from '@/types/db'
import type {
  CreateIdeaInput,
  CreateTripInput,
  DataRepo,
  ItineraryRow,
  ItineraryView,
  LeaderboardResult,
  MemberPlan,
  SetMemberPlanInput,
} from './types'
import { ensureIdeaRelations } from './logic'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/state/auth'
import { activeToken, logoutSession } from './session'

type MemberResult = Record<string, unknown>

// Toda escritura pasa por la edge function member-actions: identidad del JWT,
// validación de negocio y rate limiting viven en el servidor.
async function callMember(action: string, payload: Record<string, unknown>): Promise<MemberResult> {
  const token = activeToken()
  if (!token) throw new Error('Necesitás entrar con tu PIN para eso.')
  const { data, error } = await supabase().functions.invoke('member-actions', {
    body: { action, ...payload },
    headers: { Authorization: `Bearer ${token}` },
  })
  if (error) {
    const status = error.context?.status as number | undefined
    const msg = (data as { message?: string } | null)?.message ?? error.message ?? 'No se pudo completar'
    if (status === 429) throw new Error('Vas muy rápido, esperá un toque y volvé a intentar.')
    if (status === 401) {
      logoutSession()
      throw new Error('La sesión venció. Volvé a entrar con tu PIN.')
    }
    throw new Error(msg)
  }
  return (data ?? {}) as MemberResult
}

class SupabaseRepo implements DataRepo {
  readonly kind = 'supabase' as const

  async listUsers() {
    const { data, error } = await supabase()
      .from('users')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data as AppUser[]
  }

  async listCategories() {
    const { data, error } = await supabase()
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data as Category[]
  }

  async listTrips() {
    const { data, error } = await supabase()
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Trip[]
  }

  async getTrip(tripId: string) {
    const { data, error } = await supabase().from('trips').select('*').eq('id', tripId).maybeSingle()
    if (error) throw error
    return (data as Trip | null) ?? null
  }

  async createTrip(input: CreateTripInput) {
    const name = input.name.trim()
    const userId = input.memberIds[0]
    if (name.length < 2) throw new Error('El nombre del viaje necesita al menos 2 letras.')
    if (!userId || new Set(input.memberIds).size !== input.memberIds.length) {
      throw new Error('Faltan integrantes del viaje o hay repetidos.')
    }
    const result = await callMember('create_trip', {
      name,
      description: input.description?.trim() || null,
      currency: input.currency,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      member_ids: input.memberIds,
    })
    return result.trip as Trip
  }

  async updateTrip(tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) {
    const cleanPatch: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'name') cleanPatch.name = typeof v === 'string' ? v.trim() : v
      else cleanPatch[k] = v
    }
    const result = await callMember('update_trip', { trip_id: tripId, patch: cleanPatch })
    return result.trip as Trip
  }

  async getTripMembers(tripId: string) {
    const { data, error } = await supabase()
      .from('trip_members')
      .select('user_id, user:users(*)')
      .eq('trip_id', tripId)
    if (error) throw error
    const rows = (data ?? []) as unknown as { user: AppUser | null }[]
    const users = rows
      .map((r) => r.user)
      .filter((u): u is AppUser => Boolean(u))
      .sort((a, b) => a.sort_order - b.sort_order)
    return users
  }

  async listMemberPlans(tripId: string): Promise<MemberPlan[]> {
    const { data, error } = await supabase()
      .from('trip_members')
      .select('user_id, arrival_date, departure_date, location')
      .eq('trip_id', tripId)
    if (error) throw error
    return data as MemberPlan[]
  }

  async setMemberPlan(tripId: string, userId: string, input: SetMemberPlanInput): Promise<MemberPlan> {
    const result = await callMember('set_member_plan', {
      trip_id: tripId,
      user_id: userId,
      arrival_date: input.arrival_date ?? null,
      departure_date: input.departure_date ?? null,
      location: input.location?.trim() ? input.location.trim() : null,
    })
    return result.plan as unknown as MemberPlan
  }

  async listIdeas(tripId: string) {
    const ideaRows = await supabase().from('ideas').select('*').eq('trip_id', tripId)
    const categoryRows = await supabase().from('categories').select('*')
    const voteRows = await supabase().from('votes').select('*').in('idea_id', await this.ideaIds(tripId))
    const commentRows = await supabase().from('comments').select('id, idea_id').in('idea_id', await this.ideaIds(tripId))
    const itinRows = await supabase().from('itinerary_items').select('idea_id').eq('trip_id', tripId)
    if (ideaRows.error) throw ideaRows.error

    const users = await this.listUsers()
    const commentsMap = new Map<string, number>()
    for (const c of commentRows.data ?? []) {
      const ideaId = c.idea_id as string
      commentsMap.set(ideaId, (commentsMap.get(ideaId) ?? 0) + 1)
    }
    const itineraryIds = new Set((itinRows.data ?? []).map((i) => i.idea_id as string))
    const categories = (categoryRows.data ?? []) as Category[]

    return (ideaRows.data ?? [])
      .map((idea) =>
        ensureIdeaRelations(
          idea as Idea,
          new Map(users.map((u) => [u.id, u])),
          new Map(categories.map((c) => [c.id, c])),
          (voteRows.data ?? []) as Vote[],
          [],
          itineraryIds,
          useAuthStore.getState().currentUser?.id ?? null,
        ),
      )
      .map((rel) => ({ ...rel, comments_count: commentsMap.get(rel.id) ?? 0 }))
  }

  private async ideaIds(tripId: string): Promise<string[]> {
    const { data } = await supabase().from('ideas').select('id').eq('trip_id', tripId)
    return (data ?? []).map((d) => d.id as string)
  }

  async createIdea(input: CreateIdeaInput) {
    const title = input.title.trim()
    if (!input.category_id) {
      throw new Error('Falta elegir una categoría para la idea.')
    }
    if (title.length < 3) {
      throw new Error('El título de la idea necesita al menos 3 caracteres.')
    }
    if (input.price != null && (!Number.isFinite(input.price) || input.price < 0)) {
      throw new Error('El precio tiene que ser un número ≥ 0.')
    }
    const result = await callMember('create_idea', {
      trip_id: input.trip_id,
      category_id: input.category_id,
      title,
      description: input.description?.trim() || null,
      link: input.link?.trim() || null,
      image_url: input.image_url?.trim() || null,
      price: input.price,
      currency: input.currency,
    })
    return result.idea as Idea
  }

  async updateIdeaStatus(ideaId: string, status: IdeaStatus) {
    const result = await callMember('update_idea_status', { idea_id: ideaId, status })
    return result.idea as Idea
  }

  async deleteIdea(ideaId: string) {
    await callMember('delete_idea', { idea_id: ideaId })
  }

  async upsertVote(ideaId: string, userId: string, reaction: Reaction) {
    void userId
    await callMember('vote', { idea_id: ideaId, reaction })
  }

  async removeVote(ideaId: string, userId: string) {
    void userId
    await callMember('remove_vote', { idea_id: ideaId })
  }

  async listComments(ideaId: string) {
    const { data, error } = await supabase()
      .from('comments')
      .select('*, author:users(*)')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data.map((c) => ({ ...(c as IdeaComment), author: (c.author as AppUser | null) ?? null }))
  }

  async addComment(ideaId: string, userId: string, body: string) {
    const clean = body.trim()
    if (!clean) throw new Error('El comentario no puede estar vacío.')
    void userId
    const result = await callMember('add_comment', { idea_id: ideaId, body: clean })
    return result.comment as IdeaComment
  }

  async listItinerary(tripId: string): Promise<ItineraryView> {
    const { data, error } = await supabase()
      .from('itinerary_items')
      .select('*, idea:ideas(*)')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) throw error
    const rows = data as (ItineraryRow & { idea: Idea | null })[]
    rows.forEach((r) => {
      r.idea = r.idea ?? null
    })
    const days = [...new Set(rows.map((r) => r.day_number))]
      .sort((a, b) => a - b)
      .map((day_number) => ({ day_number, items: rows.filter((r) => r.day_number === day_number) }))
    return { days }
  }

  async addToItinerary(tripId: string, ideaId: string, dayNumber: number) {
    const result = await callMember('add_to_itinerary', {
      trip_id: tripId,
      idea_id: ideaId,
      day_number: dayNumber,
    })
    return (result as { item: ItineraryRow }).item
  }

  async removeFromItinerary(itemId: string) {
    await callMember('remove_from_itinerary', { item_id: itemId })
  }

  async moveItineraryItem(itemId: string, dayNumber: number, sortOrder: number) {
    await callMember('move_itinerary_item', { item_id: itemId, day_number: dayNumber, sort_order: sortOrder })
  }

  async getTripSummary(tripId: string) {
    const { data, error } = await supabase().functions.invoke('calculate-trip-summary', {
      body: { trip_id: tripId },
    })
    if (error) throw error
    return data as unknown as ReturnType<DataRepo['getTripSummary']> extends Promise<infer T> ? T : never
  }

  async getLeaderboard(tripId: string): Promise<LeaderboardResult> {
    const { data, error } = await supabase().functions.invoke('get-leaderboard', {
      body: { trip_id: tripId },
    })
    if (error) throw error
    return data as unknown as LeaderboardResult
  }
}

let instance: SupabaseRepo | null = null
export function supabaseRepo(): SupabaseRepo {
  if (!instance) instance = new SupabaseRepo()
  return instance
}

export type { Badge, Category, Idea, IdeaComment, UserBadge, Vote }