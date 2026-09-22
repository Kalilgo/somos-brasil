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
    const userId = input.memberIds[0]
    const { data: trip, error } = await supabase()
      .from('trips')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        currency: input.currency,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        created_by: userId,
        status: 'planning',
      })
      .select()
      .single()
    if (error) throw error
    const rows = input.memberIds.map((memberId) => ({ trip_id: trip.id as string, user_id: memberId }))
    const { error: membersError } = await supabase().from('trip_members').insert(rows)
    if (membersError) throw membersError
    return trip as Trip
  }

  async updateTrip(tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) {
    const { data, error } = await supabase()
      .from('trips')
      .update(patch)
      .eq('id', tripId)
      .select()
      .single()
    if (error) throw error
    return data as Trip
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
    const { data, error } = await supabase()
      .from('trip_members')
      .update({
        arrival_date: input.arrival_date ?? null,
        departure_date: input.departure_date ?? null,
        location: input.location?.trim() ? input.location.trim() : null,
      })
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .select('user_id, arrival_date, departure_date, location')
      .single()
    if (error) throw error
    return data as MemberPlan
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
    if (!input.category_id) {
      throw new Error('Falta elegir una categoría para la idea.')
    }
    const { data, error } = await supabase()
      .from('ideas')
      .insert({
        trip_id: input.trip_id,
        category_id: input.category_id,
        user_id: input.user_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        link: input.link?.trim() || null,
        image_url: input.image_url?.trim() || null,
        price: input.price,
        currency: input.currency,
        status: 'proposal',
      })
      .select()
      .single()
    if (error) throw error
    return data as Idea
  }

  async updateIdeaStatus(ideaId: string, status: IdeaStatus) {
    const { data, error } = await supabase()
      .from('ideas')
      .update({ status })
      .eq('id', ideaId)
      .select()
      .single()
    if (error) throw error
    return data as Idea
  }

  async deleteIdea(ideaId: string) {
    const { error } = await supabase().from('ideas').delete().eq('id', ideaId)
    if (error) throw error
  }

  async upsertVote(ideaId: string, userId: string, reaction: Reaction) {
    const { error } = await supabase()
      .from('votes')
      .upsert({ idea_id: ideaId, user_id: userId, reaction }, { onConflict: 'idea_id,user_id' })
    if (error) throw error
  }

  async removeVote(ideaId: string, userId: string) {
    const { error } = await supabase()
      .from('votes')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
    if (error) throw error
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
    const { data, error } = await supabase()
      .from('comments')
      .insert({ idea_id: ideaId, user_id: userId, body: body.trim() })
      .select()
      .single()
    if (error) throw error
    return data as IdeaComment
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
    const { data, error } = await supabase().functions.invoke('add-to-itinerary', {
      body: { trip_id: tripId, idea_id: ideaId, day_number: dayNumber },
    })
    if (error || !data?.ok) {
      const msg = (data as { message?: string } | null)?.message ?? error?.message ?? 'No se pudo agregar'
      throw new Error(msg)
    }
    return (data as { item: ItineraryRow }).item
  }

  async removeFromItinerary(itemId: string) {
    const { error } = await supabase().from('itinerary_items').delete().eq('id', itemId)
    if (error) throw error
  }

  async moveItineraryItem(itemId: string, dayNumber: number, sortOrder: number) {
    const { error } = await supabase()
      .from('itinerary_items')
      .update({ day_number: dayNumber, sort_order: sortOrder })
      .eq('id', itemId)
    if (error) throw error
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