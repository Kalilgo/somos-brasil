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
import type { MemberPlan } from '@/lib/data/types'

/**
 * Fixtures de datos para los tests.
 *
 * Cada `make*` arma un objeto completo y valido con overrides opcionales, para
 * que un test declare solo lo que le importa:
 *
 *   const idea = makeIdea({ price: 100, status: 'confirmed' })
 *
 * Los ids son deterministas y las fechas son fijas: dos corridas dan lo mismo.
 * `FIXED_NOW` se usa junto con `vi.setSystemTime` cuando el codigo lee `Date.now`.
 */

/** Momento de referencia para todo lo que dependa del reloj. */
export const FIXED_NOW = '2027-01-01T12:00:00.000Z'

/** Fechas del viaje por defecto: 10 dias, del 26/12/2026 al 04/01/2027. */
export const TRIP_START = '2026-12-26'
export const TRIP_END = '2027-01-04'

let seq = 0
const nextId = (prefix: string) => `${prefix}_${String(++seq).padStart(3, '0')}`

/** Reinicia el contador de ids. Llamalo en `beforeEach` si comparas ids. */
export function resetFixtureIds(): void {
  seq = 0
}

export function makeUser(over: Partial<AppUser> = {}): AppUser {
  return {
    id: over.id ?? nextId('u'),
    name: 'Queme',
    emoji: '🔥',
    color: '#FF5A5F',
    bio: null,
    sort_order: 1,
    created_at: FIXED_NOW,
    ...over,
  }
}

export function makeCategory(over: Partial<Category> = {}): Category {
  return {
    id: over.id ?? nextId('c'),
    slug: 'destino',
    name: 'Destino',
    emoji: '🏝️',
    color: '#FF9F1C',
    sort_order: 1,
    ...over,
  }
}

export function makeTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: over.id ?? nextId('t'),
    name: 'Brasil 2026/27',
    description: null,
    currency: 'USD',
    start_date: TRIP_START,
    end_date: TRIP_END,
    status: 'planning',
    created_by: 'u_owner',
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
    ...over,
  }
}

export function makeIdea(over: Partial<Idea> = {}): Idea {
  return {
    id: over.id ?? nextId('i'),
    trip_id: 't_default',
    category_id: 'c_default',
    user_id: 'u_default',
    title: 'Idea',
    description: null,
    link: null,
    image_url: null,
    price: null,
    currency: 'USD',
    status: 'proposal' as IdeaStatus,
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
    ...over,
  }
}

export function makeVote(over: Partial<Vote> = {}): Vote {
  return {
    id: over.id ?? nextId('v'),
    idea_id: 'i_default',
    user_id: 'u_default',
    reaction: '🔥' as Reaction,
    created_at: FIXED_NOW,
    ...over,
  }
}

export function makeComment(over: Partial<IdeaComment> = {}): IdeaComment {
  return {
    id: over.id ?? nextId('cm'),
    idea_id: 'i_default',
    user_id: 'u_default',
    body: 'Comentario',
    created_at: FIXED_NOW,
    ...over,
  }
}

export function makeBadge(over: Partial<Badge> = {}): Badge {
  return {
    id: over.id ?? nextId('b'),
    key: 'turbina',
    name: 'Turbina',
    description: 'Votaste 5+ veces',
    emoji: '⚡',
    color: '#FF5A5F',
    criteria: '≥5 votos',
    ...over,
  }
}

export function makeUserBadge(over: Partial<UserBadge> = {}): UserBadge {
  return {
    user_id: 'u_default',
    badge_id: 'b_default',
    earned_at: FIXED_NOW,
    ...over,
  }
}

export function makeItineraryItem(over: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    id: over.id ?? nextId('it'),
    trip_id: 't_default',
    idea_id: 'i_default',
    day_number: 1,
    sort_order: 1,
    notes: null,
    added_by: 'u_default',
    created_at: FIXED_NOW,
    ...over,
  }
}

export function makeMemberPlan(over: Partial<MemberPlan> = {}): MemberPlan {
  return {
    user_id: over.user_id ?? 'u_default',
    arrival_date: null,
    departure_date: null,
    location: null,
    ...over,
  }
}

/**
 * Escenario completo y coherente para probar resumen/ranking:
 * 3 usuarios, 2 categorias, 3 ideas (2 confirmadas con precio, 1 propuesta),
 * votos cruzados y un comentario. Todos los ids internos cuadran.
 */
export function makeScenario() {
  const anna = makeUser({ id: 'u_anna', name: 'Anna', emoji: '🌺', sort_order: 1 })
  const beto = makeUser({ id: 'u_beto', name: 'Beto', emoji: '🦖', sort_order: 2 })
  const caro = makeUser({ id: 'u_caro', name: 'Caro', emoji: '🍄', sort_order: 3 })
  const users = [anna, beto, caro]

  const destino = makeCategory({ id: 'c_destino', slug: 'destino', name: 'Destino' })
  const comida = makeCategory({ id: 'c_comida', slug: 'comida', name: 'Comida' })
  const categories = [destino, comida]

  const trip = makeTrip({ id: 't_brasil', currency: 'USD' })
  const iface = '2026-12-26T00:00:00'
  const ideiaA = makeIdea({
    id: 'i_a',
    trip_id: trip.id,
    category_id: destino.id,
    user_id: anna.id,
    title: 'Recife',
    price: 100,
    currency: 'USD',
    status: 'confirmed',
    created_at: iface,
  })
  const ideiaB = makeIdea({
    id: 'i_b',
    trip_id: trip.id,
    category_id: comida.id,
    user_id: beto.id,
    title: 'Churrasco',
    price: 60,
    currency: 'USD',
    status: 'confirmed',
    created_at: iface,
  })
  const ideiaC = makeIdea({
    id: 'i_c',
    trip_id: trip.id,
    category_id: destino.id,
    user_id: caro.id,
    title: 'Salvador',
    price: null,
    status: 'proposal',
    created_at: iface,
  })
  const ideas = [ideiaA, ideiaB, ideiaC]

  const votes: Vote[] = [
    makeVote({ idea_id: ideiaA.id, user_id: beto.id, reaction: '🔥' }),
    makeVote({ idea_id: ideiaA.id, user_id: caro.id, reaction: '❤️' }),
    makeVote({ idea_id: ideiaB.id, user_id: anna.id, reaction: '🔥' }),
  ]
  const comments: IdeaComment[] = [
    makeComment({ idea_id: ideiaA.id, user_id: beto.id, body: 'Vamos!' }),
  ]

  const members: MemberPlan[] = [
    makeMemberPlan({ user_id: anna.id, arrival_date: TRIP_START, departure_date: TRIP_END }),
    makeMemberPlan({ user_id: beto.id, arrival_date: '2026-12-28', departure_date: TRIP_END }),
    makeMemberPlan({ user_id: caro.id }),
  ]

  return { users, categories, trip, ideas, votes, comments, members, anna, beto, caro }
}
