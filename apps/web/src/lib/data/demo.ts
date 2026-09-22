import type {
  AppUser,
  Badge,
  Category,
  Idea,
  IdeaComment,
  IdeaStatus,
  ItineraryItem,
  Reaction,
  Trip,
  TripMember,
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
import {
  computeLeaderboard,
  computeSummary,
  demoId,
  ensureIdeaRelations,
} from './logic'
import { useAuthStore } from '@/lib/state/auth'

const LS_KEY = 'somos-brasil-demo-db'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
const iso = (h: number) => hoursAgo(h)

export const DEMO_USERS: AppUser[] = [
  { id: 'u_queme', name: 'QUEME', emoji: '🔥', color: '#FF5A5F', bio: 'El que siempre cierra la salida', sort_order: 1, created_at: iso(500) },
  { id: 'u_flor', name: 'FLOR', emoji: '🌺', color: '#FF4D6D', bio: 'Planifica todo y nunca viaja liviano', sort_order: 2, created_at: iso(500) },
  { id: 'u_dozo', name: 'DOZO', emoji: '🦖', color: '#7C3AED', bio: 'Vive el viaje, duerme en el aeropuerto', sort_order: 3, created_at: iso(500) },
  { id: 'u_hongo', name: 'HONGO', emoji: '🍄', color: '#10B981', bio: 'El que encuentra los precios más raros', sort_order: 4, created_at: iso(500) },
  { id: 'u_gonza', name: 'GONZA', emoji: '⚽', color: '#F59E0B', bio: 'Delega todo, discute todo', sort_order: 5, created_at: iso(500) },
  { id: 'u_kalil', name: 'KALIL', emoji: '🐪', color: '#0EA5E9', bio: 'El DJ oficial del grupo', sort_order: 6, created_at: iso(500) },
]

export const DEMO_CATEGORIES: Category[] = [
  { id: 'c_destino', slug: 'destino', name: 'Destino', emoji: '🏝️', color: '#FF9F1C', sort_order: 1 },
  { id: 'c_alojamiento', slug: 'alojamiento', name: 'Alojamiento', emoji: '🛏️', color: '#7C3AED', sort_order: 2 },
  { id: 'c_transporte', slug: 'transporte', name: 'Transporte', emoji: '✈️', color: '#2E86DE', sort_order: 3 },
  { id: 'c_lugares', slug: 'lugares', name: 'Lugares para visitar', emoji: '🏖️', color: '#00A878', sort_order: 4 },
  { id: 'c_comida', slug: 'comida', name: 'Comida y bares', emoji: '🍹', color: '#FF4D6D', sort_order: 5 },
  { id: 'c_actividades', slug: 'actividades', name: 'Actividades', emoji: '🎸', color: '#FF5A5F', sort_order: 6 },
  { id: 'c_extras', slug: 'extras', name: 'Gastos varios', emoji: '🎒', color: '#6F5F57', sort_order: 7 },
]

export const DEMO_BADGES: Badge[] = [
  { id: 'b_explorador', key: 'explorador', name: 'Explorador', emoji: '🧭', color: '#10B981', description: 'Propusiste ideas en 4+ categorías', criteria: 'Ideas en ≥4 categorías distintas' },
  { id: 'b_cazador', key: 'cazador', name: 'Cazador de ofertas', emoji: '💸', color: '#FF9F1C', description: '3 ideas con el precio más bajo de su categoría', criteria: '≥3 ideas más baratas de su categoría' },
  { id: 'b_turbina', key: 'turbina', name: 'Turbina', emoji: '⚡', color: '#FF5A5F', description: 'Votaste 5+ veces', criteria: '≥5 votos' },
  { id: 'b_impulsor', key: 'impulsor', name: 'Impulsor', emoji: '🚀', color: '#2E86DE', description: '3+ ideas tuyas confirmadas', criteria: '≥3 ideas confirmadas' },
  { id: 'b_radio', key: 'radio', name: 'Radio', emoji: '📻', color: '#7C3AED', description: 'Comentaste 5+ veces', criteria: '≥5 comentarios' },
]

interface DemoDb {
  version: number
  trips: Trip[]
  members: TripMember[]
  ideas: Idea[]
  votes: Vote[]
  comments: IdeaComment[]
  itinerary: ItineraryItem[]
  user_badges: UserBadge[]
}

function seedDb(): DemoDb {
  const trip: Trip = {
    id: 't_brasil2026',
    name: 'Brasil 2026/27: Fin de año',
    description:
      'Recife + Olinda para el Reveillon, con un ojo en Salvador. Del 26 de diciembre al 4 de enero.',
    currency: 'USD',
    start_date: '2026-12-26',
    end_date: '2027-01-04',
    status: 'planning',
    created_by: 'u_queme',
    created_at: iso(96),
    updated_at: iso(3),
  }

  return {
    version: 4,
    trips: [trip],
    members: DEMO_USERS.map((u) => {
      const dates: Record<string, { arrival_date: string; departure_date: string }> = {
        u_dozo: { arrival_date: '2026-12-28', departure_date: '2027-01-04' },
        u_hongo: { arrival_date: '2026-12-27', departure_date: '2027-01-02' },
        u_gonza: { arrival_date: '2026-12-26', departure_date: '2027-01-04' },
      }
      const d = dates[u.id]
      return {
        trip_id: trip.id,
        user_id: u.id,
        joined_at: iso(96),
        arrival_date: d?.arrival_date ?? null,
        departure_date: d?.departure_date ?? null,
        location: null,
      }
    }),
    ideas: [],
    votes: [],
    comments: [],
    itinerary: [],
    user_badges: [],
  }
}

function loadOrSeed(): DemoDb {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb
      if (parsed.version === 4 && parsed.trips?.length) return parsed
    }
  } catch {
    // seed fresh
  }
  const db = seedDb()
  persist(db)
  return db
}

function persist(db: DemoDb) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db))
  } catch {
    // storage full / private mode: ok, seguimos en memoria
  }
}

export const resetDemoDb = () => persist(seedDb())

const now = () => new Date().toISOString()

class DemoRepo implements DataRepo {
  readonly kind = 'demo' as const
  private db: DemoDb

  constructor() {
    this.db = loadOrSeed()
  }

  private save() {
    persist(this.db)
  }

  private userById = (userId: string) => DEMO_USERS.find((u) => u.id === userId) ?? null

  async listUsers() {
    return [...DEMO_USERS].sort((a, b) => a.sort_order - b.sort_order)
  }

  async listCategories() {
    return [...DEMO_CATEGORIES].sort((a, b) => a.sort_order - b.sort_order)
  }

  async listTrips() {
    return [...this.db.trips].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  async getTrip(tripId: string) {
    return this.db.trips.find((t) => t.id === tripId) ?? null
  }

  async createTrip(input: CreateTripInput) {
    const trip: Trip = {
      id: demoId('t'),
      name: input.name,
      description: input.description ?? null,
      currency: input.currency,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      status: 'planning',
      created_by: input.memberIds[0],
      created_at: now(),
      updated_at: now(),
    }
    this.db.trips.push(trip)
    for (const userId of input.memberIds) {
      this.db.members.push({ trip_id: trip.id, user_id: userId, joined_at: now(), arrival_date: null, departure_date: null, location: null })
    }
    this.save()
    return trip
  }

  async updateTrip(tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) {
    const trip = this.db.trips.find((t) => t.id === tripId)
    if (!trip) throw new Error('Viaje no encontrado')
    Object.assign(trip, patch, { updated_at: now() })
    this.save()
    return trip
  }

  async getTripMembers(tripId: string) {
    const ids = this.db.members.filter((m) => m.trip_id === tripId).map((m) => m.user_id)
    return DEMO_USERS.filter((u) => ids.includes(u.id)).sort((a, b) => a.sort_order - b.sort_order)
  }

  async listMemberPlans(tripId: string): Promise<MemberPlan[]> {
    return this.db.members
      .filter((m) => m.trip_id === tripId)
      .map((m) => ({ user_id: m.user_id, arrival_date: m.arrival_date, departure_date: m.departure_date, location: m.location }))
  }

  async setMemberPlan(tripId: string, userId: string, input: SetMemberPlanInput): Promise<MemberPlan> {
    const member = this.db.members.find((m) => m.trip_id === tripId && m.user_id === userId)
    if (!member) throw new Error('No sos parte de este viaje')
    member.arrival_date = input.arrival_date ?? null
    member.departure_date = input.departure_date ?? null
    member.location = input.location?.trim() ? input.location.trim() : null
    this.save()
    return { user_id: member.user_id, arrival_date: member.arrival_date, departure_date: member.departure_date, location: member.location }
  }

  private buildRelations(tripId: string) {
    const userId = useAuthStore.getState().currentUser?.id ?? null
    const tripsIdeas = this.db.ideas.filter((i) => i.trip_id === tripId)
    const itineraryIds = new Set(this.db.itinerary.filter((i) => i.trip_id === tripId).map((i) => i.idea_id))
    const userById = new Map(DEMO_USERS.map((u) => [u.id, u]))
    const categoryById = new Map(DEMO_CATEGORIES.map((c) => [c.id, c]))
    return tripsIdeas.map((i) =>
      ensureIdeaRelations(i, userById, categoryById, this.db.votes, this.db.comments, itineraryIds, userId),
    )
  }

  async listIdeas(tripId: string) {
    return this.buildRelations(tripId)
  }

  async createIdea(input: CreateIdeaInput) {
    const idea: Idea = {
      id: demoId('i'),
      trip_id: input.trip_id,
      category_id: input.category_id,
      user_id: input.user_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      link: input.link?.trim() || null,
      image_url: input.image_url?.trim() || null,
      price: input.price ?? null,
      currency: input.currency,
      status: 'proposal',
      created_at: now(),
      updated_at: now(),
    }
    this.db.ideas.push(idea)
    this.save()
    return idea
  }

  async updateIdeaStatus(ideaId: string, status: IdeaStatus) {
    const idea = this.db.ideas.find((i) => i.id === ideaId)
    if (!idea) throw new Error('Idea no encontrada')
    idea.status = status
    idea.updated_at = now()
    this.save()
    return idea
  }

  async deleteIdea(ideaId: string) {
    this.db.ideas = this.db.ideas.filter((i) => i.id !== ideaId)
    this.db.votes = this.db.votes.filter((v) => v.idea_id !== ideaId)
    this.db.comments = this.db.comments.filter((c) => c.idea_id !== ideaId)
    this.db.itinerary = this.db.itinerary.filter((i) => i.idea_id !== ideaId)
    this.save()
  }

  async upsertVote(ideaId: string, userId: string, reaction: Reaction) {
    const existing = this.db.votes.find((v) => v.idea_id === ideaId && v.user_id === userId)
    if (existing) {
      existing.reaction = reaction
      existing.created_at = now()
    } else {
      this.db.votes.push({ id: demoId('v'), idea_id: ideaId, user_id: userId, reaction, created_at: now() })
    }
    this.save()
  }

  async removeVote(ideaId: string, userId: string) {
    this.db.votes = this.db.votes.filter((v) => !(v.idea_id === ideaId && v.user_id === userId))
    this.save()
  }

  async listComments(ideaId: string) {
    return this.db.comments
      .filter((c) => c.idea_id === ideaId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({ ...c, author: this.userById(c.user_id) }))
  }

  async addComment(ideaId: string, userId: string, body: string) {
    const comment: IdeaComment = {
      id: demoId('cm'),
      idea_id: ideaId,
      user_id: userId,
      body: body.trim(),
      created_at: now(),
    }
    this.db.comments.push(comment)
    this.save()
    return comment
  }

  async listItinerary(tripId: string): Promise<ItineraryView> {
    const items = this.db.itinerary
      .filter((i) => i.trip_id === tripId)
      .sort((a, b) => a.day_number - b.day_number || a.sort_order - b.sort_order)
    const rows: ItineraryRow[] = items.map((it) => ({
      ...it,
      idea: this.db.ideas.find((i) => i.id === it.idea_id) ?? null,
    }))
    const days = [...new Set(rows.map((r) => r.day_number))].sort((a, b) => a - b).map((day_number) => ({
      day_number,
      items: rows.filter((r) => r.day_number === day_number),
    }))
    return { days }
  }

  async addToItinerary(tripId: string, ideaId: string, dayNumber: number) {
    const idea = this.db.ideas.find((i) => i.id === ideaId)
    if (!idea || idea.status !== 'confirmed') throw new Error('Solo se agregan al itinerario ideas confirmadas')
    if (this.db.itinerary.some((i) => i.idea_id === ideaId)) throw new Error('Esa idea ya está en el itinerario')
    const sameDay = this.db.itinerary.filter((i) => i.trip_id === tripId && i.day_number === dayNumber).length
    const item: ItineraryItem = {
      id: demoId('it'),
      trip_id: tripId,
      idea_id: ideaId,
      day_number: dayNumber,
      sort_order: sameDay + 1,
      notes: null,
      added_by: useAuthStore.getState().currentUser?.id ?? idea.user_id,
      created_at: now(),
    }
    this.db.itinerary.push(item)
    this.save()
    return item
  }

  async removeFromItinerary(itemId: string) {
    this.db.itinerary = this.db.itinerary.filter((i) => i.id !== itemId)
    this.save()
  }

  async moveItineraryItem(itemId: string, dayNumber: number, sortOrder: number) {
    const item = this.db.itinerary.find((i) => i.id === itemId)
    if (!item) throw new Error('Ítem no encontrado')
    item.day_number = dayNumber
    item.sort_order = sortOrder
    this.save()
  }

  async getTripSummary(tripId: string) {
    const trip = this.db.trips.find((t) => t.id === tripId)
    if (!trip) throw new Error('Viaje no encontrado')
    const ideas = this.db.ideas.filter((i) => i.trip_id === tripId)
    const plans = this.db.members
      .filter((m) => m.trip_id === tripId)
      .map((m) => ({
        user_id: m.user_id,
        arrival_date: m.arrival_date,
        departure_date: m.departure_date,
        location: m.location,
      }))
    return computeSummary(ideas, DEMO_CATEGORIES, trip, plans, DEMO_USERS)
  }

  async getLeaderboard(tripId: string): Promise<LeaderboardResult> {
    const ideaIds = this.db.ideas.filter((i) => i.trip_id === tripId).map((i) => i.id)
    const votes = this.db.votes.filter((v) => ideaIds.includes(v.idea_id))
    const comments = this.db.comments.filter((c) => ideaIds.includes(c.idea_id))
    const activeIds = this.db.members.filter((m) => m.trip_id === tripId).map((m) => m.user_id)
    const result = computeLeaderboard(
      DEMO_USERS,
      this.db.ideas.filter((i) => i.trip_id === tripId),
      votes,
      comments,
      DEMO_CATEGORIES,
      DEMO_BADGES,
      this.db.user_badges,
      activeIds,
    )
    if (result.newly.length) {
      for (const { user, badge } of result.newly) {
        this.db.user_badges.push({ user_id: user.id, badge_id: badge.id, earned_at: now() })
      }
      this.save()
    }
    const badgeById = new Map(DEMO_BADGES.map((b) => [b.id, b]))
    const all = this.db.user_badges.map((ub) => ({ ...ub, badge: badgeById.get(ub.badge_id) ?? null }))
    const newly = result.newly.map((n) => ({
      user_id: n.user.id,
      badge_id: n.badge.id,
      earned_at: now(),
      badge: n.badge,
    }))
    return { ranking: result.ranking, badges: all, newly_earned: newly }
  }
}

let instance: DemoRepo | null = null
export function demoRepo(): DemoRepo {
  if (!instance) instance = new DemoRepo()
  return instance
}