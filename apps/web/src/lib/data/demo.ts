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
  members: { trip_id: string; user_id: string; joined_at: string }[]
  ideas: Idea[]
  votes: Vote[]
  comments: IdeaComment[]
  itinerary: ItineraryItem[]
  user_badges: UserBadge[]
}

function seedDb(): DemoDb {
  const trip: Trip = {
    id: 't_brasil2026',
    name: 'Brasil 2026: Carnaval',
    description:
      'Gran candidato: Recife + Olinda en carnaval, con un ojo en Salvador. Fechas tentativas para Febrero.',
    currency: 'USD',
    start_date: '2026-02-10',
    end_date: '2026-02-24',
    status: 'planning',
    created_by: 'u_queme',
    created_at: iso(96),
    updated_at: iso(3),
  }

  const ideas: Idea[] = [
    { id: 'i_recife', trip_id: trip.id, category_id: 'c_destino', user_id: 'u_hongo', title: 'Recife + Olinda: el carnaval de verdad', description: 'El carnaval más popular del país, sin turistada. Bloque de frevo hasta las 5am.', link: 'https://example.com/olinda-carnaval', image_url: null, price: null, currency: 'USD', status: 'confirmed', created_at: iso(72), updated_at: iso(3) },
    { id: 'i_rio', trip_id: trip.id, category_id: 'c_destino', user_id: 'u_gonza', title: 'Río de Janeiro (el clásico)', description: 'Copacabana, Cristo y playa. Más turístico pero nunca falla.', link: null, image_url: null, price: 2400, currency: 'USD', status: 'discussing', created_at: iso(70), updated_at: iso(20) },
    { id: 'i_salvador', trip_id: trip.id, category_id: 'c_destino', user_id: 'u_flor', title: 'Salvador de Bahía', description: 'Axé y realidad. Vuela el presupuesto pero el carnaval es épico.', link: null, image_url: null, price: 2100, currency: 'USD', status: 'proposal', created_at: iso(68), updated_at: iso(68) },
    { id: 'i_airbnb', trip_id: trip.id, category_id: 'c_alojamiento', user_id: 'u_gonza', title: 'Airbnb en Olinda frente al mar', description: 'Casa para 8 con pileta. Cierra 45usd/noche por cabeza.', link: 'https://example.com/olinda-airbnb', image_url: null, price: 360, currency: 'USD', status: 'confirmed', created_at: iso(60), updated_at: iso(2) },
    { id: 'i_pousada', trip_id: trip.id, category_id: 'c_alojamiento', user_id: 'u_dozo', title: 'Pousada dos Sonhos', description: 'Hostel con onda, más barato. No le pidamos pileta.', link: null, image_url: null, price: 28, currency: 'USD', status: 'proposal', created_at: iso(55), updated_at: iso(55) },
    { id: 'i_boaviagem', trip_id: trip.id, category_id: 'c_alojamiento', user_id: 'u_queme', title: 'Hotel en Boa Viagem (Recife)', description: 'Solo para los días de Recife. Buena playa urbana.', link: null, image_url: null, price: 65, currency: 'USD', status: 'proposal', created_at: iso(50), updated_at: iso(50) },
    { id: 'i_vuelo', trip_id: trip.id, category_id: 'c_transporte', user_id: 'u_kalil', title: 'Vuelo ida y vuelta EZE → REC', description: 'Directo, maleta despachada. Conseguió precio de cabotaje.', link: 'https://example.com/flight-search', image_url: null, price: 860, currency: 'USD', status: 'confirmed', created_at: iso(48), updated_at: iso(1) },
    { id: 'i_auto', trip_id: trip.id, category_id: 'c_transporte', user_id: 'u_hongo', title: 'Alquilar auto por 5 días', description: 'Para bajadas a Porto de Galinhas. Repartimos costo.', link: null, image_url: null, price: 320, currency: 'USD', status: 'confirmed', created_at: iso(45), updated_at: iso(5) },
    { id: 'i_bus', trip_id: trip.id, category_id: 'c_transporte', user_id: 'u_gonza', title: 'Bus nocturno Recife → Salvador', description: 'Ahorras una noche de hotel. Nadie duerme, misión imposible.', link: null, image_url: null, price: 55, currency: 'USD', status: 'proposal', created_at: iso(40), updated_at: iso(40) },
    { id: 'i_marcozero', trip_id: trip.id, category_id: 'c_lugares', user_id: 'u_flor', title: 'Marco Zero + muñeco de frevo', description: 'El corazon de Recife Antigo. Gratis y obligatorio.', link: null, image_url: null, price: 0, currency: 'USD', status: 'confirmed', created_at: iso(36), updated_at: iso(36) },
    { id: 'i_boaplaya', trip_id: trip.id, category_id: 'c_lugares', user_id: 'u_dozo', title: 'Praia de Boa Viagem', description: 'Playón urbano con la mejor brisa. Ojo con la marea.', link: null, image_url: null, price: 0, currency: 'USD', status: 'confirmed', created_at: iso(34), updated_at: iso(34) },
    { id: 'i_olinda', trip_id: trip.id, category_id: 'c_lugares', user_id: 'u_queme', title: 'Olinda: casco histórico', description: 'Cuestas, colores y frevo callejero con los bloques.', link: null, image_url: null, price: 0, currency: 'USD', status: 'discussing', created_at: iso(32), updated_at: iso(32) },
    { id: 'i_mercado', trip_id: trip.id, category_id: 'c_comida', user_id: 'u_flor', title: 'Almuerzo en el Mercado de São José', description: 'Todo fresco, precio de local.', link: null, image_url: null, price: 12, currency: 'BRL', status: 'confirmed', created_at: iso(28), updated_at: iso(28) },
    { id: 'i_carne', trip_id: trip.id, category_id: 'c_comida', user_id: 'u_hongo', title: 'Bodega de carne en Boa Viagem', description: 'Picanha que no se olvida. Caro pero el recuerdo no tiene precio.', link: null, image_url: null, price: 8, currency: 'USD', status: 'proposal', created_at: iso(26), updated_at: iso(26) },
    { id: 'i_acaraje', trip_id: trip.id, category_id: 'c_comida', user_id: 'u_kalil', title: 'Acarajé en Salvador', description: 'Desayuno/merienda santo. Tapatapa en la calle.', link: null, image_url: null, price: 5, currency: 'BRL', status: 'proposal', created_at: iso(24), updated_at: iso(24) },
    { id: 'i_forro', trip_id: trip.id, category_id: 'c_actividades', user_id: 'u_kalil', title: 'Clase de forró', description: '2 horas con bailarina local. Medio grupo se engancha devuelta.', link: null, image_url: null, price: 20, currency: 'USD', status: 'confirmed', created_at: iso(22), updated_at: iso(22) },
    { id: 'i_buceo', trip_id: trip.id, category_id: 'c_actividades', user_id: 'u_queme', title: 'Buceo en Porto de Galinhas', description: 'Piscinas naturales con tiburones de arrecife. Incluye equipo y guía.', link: null, image_url: null, price: 95, currency: 'USD', status: 'discussing', created_at: iso(18), updated_at: iso(18) },
    { id: 'i_frevo', trip_id: trip.id, category_id: 'c_actividades', user_id: 'u_dozo', title: 'Salir con una escuela de frevo', description: 'Dónde duerme una escuela local una noche de carnaval. Bestia.', link: null, image_url: null, price: 30, currency: 'USD', status: 'proposal', created_at: iso(16), updated_at: iso(16) },
    { id: 'i_seguro', trip_id: trip.id, category_id: 'c_extras', user_id: 'u_hongo', title: 'Seguro de viaje (14 días)', description: 'Cobertura completa, imprescindible para andar tranquilos.', link: 'https://example.com/insurance', image_url: null, price: 60, currency: 'USD', status: 'confirmed', created_at: iso(12), updated_at: iso(12) },
    { id: 'i_esim', trip_id: trip.id, category_id: 'c_extras', user_id: 'u_queme', title: 'eSIM con datos (15GB)', description: 'Junto al eSIM de cada uno para no depender del wifi.', link: null, image_url: null, price: 25, currency: 'USD', status: 'proposal', created_at: iso(10), updated_at: iso(10) },
  ]

  const votes: Vote[] = [
    { id: demoId('v'), idea_id: 'i_recife', user_id: 'u_queme', reaction: '🔥', created_at: iso(2) },
    { id: demoId('v'), idea_id: 'i_recife', user_id: 'u_flor', reaction: '🔥', created_at: iso(2) },
    { id: demoId('v'), idea_id: 'i_recife', user_id: 'u_gonza', reaction: '😐', created_at: iso(2) },
    { id: demoId('v'), idea_id: 'i_rio', user_id: 'u_queme', reaction: '🔥', created_at: iso(20) },
    { id: demoId('v'), idea_id: 'i_rio', user_id: 'u_hongo', reaction: '🙅', created_at: iso(20) },
    { id: demoId('v'), idea_id: 'i_airbnb', user_id: 'u_kalil', reaction: '❤️', created_at: iso(1) },
    { id: demoId('v'), idea_id: 'i_airbnb', user_id: 'u_flor', reaction: '❤️', created_at: iso(1) },
    { id: demoId('v'), idea_id: 'i_airbnb', user_id: 'u_dozo', reaction: '🔥', created_at: iso(1) },
    { id: demoId('v'), idea_id: 'i_pousada', user_id: 'u_gonza', reaction: '🔥', created_at: iso(6) },
    { id: demoId('v'), idea_id: 'i_pousada', user_id: 'u_hongo', reaction: '🔥', created_at: iso(6) },
    { id: demoId('v'), idea_id: 'i_pousada', user_id: 'u_queme', reaction: '🙅', created_at: iso(6) },
    { id: demoId('v'), idea_id: 'i_vuelo', user_id: 'u_queme', reaction: '🔥', created_at: iso(1) },
    { id: demoId('v'), idea_id: 'i_vuelo', user_id: 'u_kalil', reaction: '🔥', created_at: iso(1) },
    { id: demoId('v'), idea_id: 'i_vuelo', user_id: 'u_flor', reaction: '❤️', created_at: iso(1) },
    { id: demoId('v'), idea_id: 'i_auto', user_id: 'u_dozo', reaction: '🔥', created_at: iso(4) },
    { id: demoId('v'), idea_id: 'i_auto', user_id: 'u_kalil', reaction: '🔥', created_at: iso(4) },
    { id: demoId('v'), idea_id: 'i_buceo', user_id: 'u_gonza', reaction: '❤️', created_at: iso(8) },
    { id: demoId('v'), idea_id: 'i_buceo', user_id: 'u_kalil', reaction: '❤️', created_at: iso(8) },
    { id: demoId('v'), idea_id: 'i_buceo', user_id: 'u_flor', reaction: '😐', created_at: iso(8) },
    { id: demoId('v'), idea_id: 'i_forro', user_id: 'u_queme', reaction: '😐', created_at: iso(5) },
    { id: demoId('v'), idea_id: 'i_forro', user_id: 'u_gonza', reaction: '🔥', created_at: iso(5) },
    { id: demoId('v'), idea_id: 'i_acaraje', user_id: 'u_flor', reaction: '🔥', created_at: iso(7) },
    { id: demoId('v'), idea_id: 'i_marcozero', user_id: 'u_queme', reaction: '🔥', created_at: iso(3) },
    { id: demoId('v'), idea_id: 'i_mercado', user_id: 'u_dozo', reaction: '❤️', created_at: iso(3) },
    { id: demoId('v'), idea_id: 'i_esim', user_id: 'u_hongo', reaction: '🔥', created_at: iso(2) },
  ]

  const comments: IdeaComment[] = [
    { id: demoId('cm'), idea_id: 'i_airbnb', user_id: 'u_queme', body: '¿Cuántas noches? Si es solo Olinda la hacemos de 10', created_at: iso(1) },
    { id: demoId('cm'), idea_id: 'i_airbnb', user_id: 'u_gonza', body: '6 noches y después Recife/hostel', created_at: iso(1) },
    { id: demoId('cm'), idea_id: 'i_recife', user_id: 'u_gonza', body: '¿Pero y la playa? Recife tiene buena playa urbana', created_at: iso(2) },
    { id: demoId('cm'), idea_id: 'i_buceo', user_id: 'u_dozo', body: 'Tiburoncitos de arrecife no muerden, confíen 🙏', created_at: iso(8) },
    { id: demoId('cm'), idea_id: 'i_vuelo', user_id: 'u_flor', body: 'Ese precio es un robo, lo cerramos ya', created_at: iso(1) },
    { id: demoId('cm'), idea_id: 'i_salvador', user_id: 'u_kalil', body: 'El axé me tienta, pero el presupuesto no', created_at: iso(9) },
    { id: demoId('cm'), idea_id: 'i_pousada', user_id: 'u_hongo', body: 'Yo diría que reservamos como backup si se cae el Airbnb', created_at: iso(6) },
  ]

  const itinerary: ItineraryItem[] = [
    { id: demoId('it'), trip_id: trip.id, idea_id: 'i_vuelo', day_number: 1, sort_order: 1, notes: 'Llegada temprano, a no perder la tarde', added_by: 'u_kalil', created_at: iso(3) },
    { id: demoId('it'), trip_id: trip.id, idea_id: 'i_airbnb', day_number: 1, sort_order: 2, notes: 'Check-in, patear lo que queda del día', added_by: 'u_flor', created_at: iso(3) },
    { id: demoId('it'), trip_id: trip.id, idea_id: 'i_marcozero', day_number: 2, sort_order: 1, notes: null, added_by: 'u_flor', created_at: iso(3) },
    { id: demoId('it'), trip_id: trip.id, idea_id: 'i_mercado', day_number: 2, sort_order: 2, notes: 'Almorzar barato y rico', added_by: 'u_flor', created_at: iso(3) },
    { id: demoId('it'), trip_id: trip.id, idea_id: 'i_boaplaya', day_number: 3, sort_order: 1, notes: null, added_by: 'u_dozo', created_at: iso(3) },
    { id: demoId('it'), trip_id: trip.id, idea_id: 'i_forro', day_number: 3, sort_order: 2, notes: null, added_by: 'u_kalil', created_at: iso(3) },
  ]

  return {
    version: 1,
    trips: [trip],
    members: DEMO_USERS.map((u) => ({ trip_id: trip.id, user_id: u.id, joined_at: iso(96) })),
    ideas,
    votes,
    comments,
    itinerary,
    user_badges: [
      { user_id: 'u_hongo', badge_id: 'b_cazador', earned_at: iso(30) },
    ],
  }
}

function loadOrSeed(): DemoDb {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb
      if (parsed.version === 1 && parsed.trips?.length) return parsed
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
      this.db.members.push({ trip_id: trip.id, user_id: userId, joined_at: now() })
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
    const ideas = this.db.ideas.filter((i) => i.trip_id === tripId)
    const memberCount = this.db.members.filter((m) => m.trip_id === tripId).length
    return computeSummary(ideas, DEMO_CATEGORIES, memberCount, trip?.currency ?? 'USD')
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