import { describe, expect, it } from 'vitest'
import {
  badgeRules,
  computeLeaderboard,
  computeSummary,
  demoId,
  emptyVoteCounts,
  ensureIdeaRelations,
  groupItinerary,
} from './logic'
import {
  makeBadge,
  makeCategory,
  makeComment,
  makeIdea,
  makeScenario,
  makeUser,
  makeUserBadge,
  makeVote,
} from '@/test/fixtures'

describe('emptyVoteCounts', () => {
  it('devuelve las cuatro reacciones en cero', () => {
    const counts = emptyVoteCounts()
    expect(counts).toEqual({ '🔥': 0, '❤️': 0, '😐': 0, '🙅': 0 })
  })

  it('cada llamada es un objeto nuevo (no se comparte estado)', () => {
    const a = emptyVoteCounts()
    a['🔥'] = 3
    expect(emptyVoteCounts()['🔥']).toBe(0)
  })
})

describe('computeSummary', () => {
  const s = makeScenario()

  it('cuenta confirmadas, miembros y moneda', () => {
    const summary = computeSummary(s.ideas, s.categories, s.trip, s.members, s.users)
    expect(summary.confirmed_count).toBe(2)
    expect(summary.member_count).toBe(3)
    expect(summary.trip_currency).toBe('USD')
  })

  it('solo suma ideas confirmadas con precio, por categoria', () => {
    const summary = computeSummary(s.ideas, s.categories, s.trip, s.members, s.users)
    const porCategoria = new Map(summary.totals_per_category.map((c) => [c.slug, c]))
    expect(porCategoria.get('destino')).toMatchObject({ total: 100, count: 1 })
    expect(porCategoria.get('comida')).toMatchObject({ total: 60, count: 1 })
    expect(summary.totals_per_category).toHaveLength(2)
  })

  it('agrupa los totales por moneda', () => {
    const summary = computeSummary(s.ideas, s.categories, s.trip, s.members, s.users)
    expect(summary.totals_per_currency).toEqual([{ currency: 'USD', total: 160 }])
  })

  it('suma los dias presentes de los que pagan y calcula el per day', () => {
    const summary = computeSummary(s.ideas, s.categories, s.trip, s.members, s.users)
    expect(summary.payer_total_days).toBe(18)
    expect(summary.per_person).toHaveLength(1)
    expect(summary.per_person[0].total).toBe(160)
    expect(summary.per_person[0].per_day).toBeCloseTo(160 / 18)
  })

  it('incluye los dias presentes de cada miembro (null si no puso fechas)', () => {
    const summary = computeSummary(s.ideas, s.categories, s.trip, s.members, s.users)
    const porId = new Map(summary.members.map((m) => [m.user_id, m]))
    expect(porId.get('u_anna')).toMatchObject({ name: 'Anna', days_present: 10 })
    expect(porId.get('u_beto')).toMatchObject({ days_present: 8 })
    expect(porId.get('u_caro')).toMatchObject({ days_present: null })
  })

  it('una categoria confirmada sin precio cuenta, pero no suma plata', () => {
    const categoria = makeCategory({ id: 'c_1', slug: 'extras' })
    const idea = makeIdea({ category_id: 'c_1', status: 'confirmed', price: null })
    const summary = computeSummary([idea], [categoria], makeScenarioTrip(), [], [])
    expect(summary.totals_per_category).toHaveLength(1)
    expect(summary.totals_per_category[0]).toMatchObject({ total: null, count: 1 })
    expect(summary.totals_per_currency).toEqual([])
    expect(summary.per_person).toEqual([])
  })

  function makeScenarioTrip() {
    return makeScenario().trip
  }
})

describe('computeLeaderboard', () => {
  const s = makeScenario()

  it('calcula el puntaje con los pesos y ordena de mayor a menor', () => {
    const { ranking } = computeLeaderboard(
      s.users,
      s.ideas,
      s.votes,
      s.comments,
      s.categories,
      [],
      [],
      s.users.map((u) => u.id),
    )
    expect(ranking.map((r) => r.user_id)).toEqual(['u_beto', 'u_anna', 'u_caro'])
    expect(ranking.map((r) => r.score)).toEqual([7, 6, 4])
    expect(ranking[0]).toMatchObject({ ideas: 1, votes: 1, comments: 1 })
    expect(ranking[1]).toMatchObject({ ideas: 1, votes: 1, comments: 0 })
  })

  it('ignora a los usuarios que no son activos en el viaje', () => {
    const { ranking } = computeLeaderboard(
      s.users,
      s.ideas,
      s.votes,
      s.comments,
      s.categories,
      [],
      [],
      ['u_anna'],
    )
    expect(ranking.map((r) => r.user_id)).toEqual(['u_anna'])
  })

  it('marca como nueva la insignia ganada que todavia no figura como earned', () => {
    const u1 = makeUser({ id: 'u_1', name: 'Uno' })
    const u2 = makeUser({ id: 'u_2', name: 'Dos' })
    const c1 = makeCategory({ id: 'c_1' })
    const ideas = Array.from({ length: 5 }, (_, i) =>
      makeIdea({ id: `i_${i}`, category_id: 'c_1', user_id: 'u_2' }),
    )
    const votes = ideas.map((idea, i) => makeVote({ id: `v_${i}`, idea_id: idea.id, user_id: 'u_1' }))
    const turbina = makeBadge({ id: 'b_turbina', key: 'turbina' })

    const result = computeLeaderboard(
      [u1, u2],
      ideas,
      votes,
      [],
      [c1],
      [turbina],
      [],
      ['u_1', 'u_2'],
    )
    expect(result.newly).toHaveLength(1)
    expect(result.newly[0].user.id).toBe('u_1')
    expect(result.newly[0].badge.key).toBe('turbina')

    const yaGanada = computeLeaderboard(
      [u1, u2],
      ideas,
      votes,
      [],
      [c1],
      [turbina],
      [makeUserBadge({ user_id: 'u_1', badge_id: 'b_turbina' })],
      ['u_1', 'u_2'],
    )
    expect(yaGanada.newly).toHaveLength(0)
  })
})

describe('badgeRules', () => {
  const stats = (over: Record<string, unknown> = {}) => ({
    ideasProposed: 0,
    votesCast: 0,
    reactionsReceived: 0,
    commentsMade: 0,
    ideasConfirmed: 0,
    categoriesTouched: 0,
    cheapestIdeas: 0,
    activityDays: new Set<string>(),
    ...over,
  })

  it('explorador: 4+ categorias', () => {
    const rule = badgeRules.get('explorador')!
    expect(rule.earned(stats({ categoriesTouched: 3 }))).toBe(false)
    expect(rule.earned(stats({ categoriesTouched: 4 }))).toBe(true)
  })

  it('turbina: 5+ votos', () => {
    const rule = badgeRules.get('turbina')!
    expect(rule.earned(stats({ votesCast: 4 }))).toBe(false)
    expect(rule.earned(stats({ votesCast: 5 }))).toBe(true)
  })

  it('cazador: 3+ ideas mas baratas', () => {
    const rule = badgeRules.get('cazador')!
    expect(rule.earned(stats({ cheapestIdeas: 3 }))).toBe(true)
  })

  it('impulsor: 3+ ideas confirmadas', () => {
    const rule = badgeRules.get('impulsor')!
    expect(rule.earned(stats({ ideasConfirmed: 3 }))).toBe(true)
  })

  it('radio: 5+ comentarios', () => {
    const rule = badgeRules.get('radio')!
    expect(rule.earned(stats({ commentsMade: 5 }))).toBe(true)
  })
})

describe('groupItinerary', () => {
  it('agrupa por dia y ordena por dia y sort_order', () => {
    const items = [
      { day_number: 2, sort_order: 2 },
      { day_number: 1, sort_order: 2 },
      { day_number: 1, sort_order: 1 },
      { day_number: 2, sort_order: 1 },
    ]
    const groups = groupItinerary(items)
    expect(groups.map((g) => g.day_number)).toEqual([1, 2])
    expect(groups[0].items.map((i) => i.sort_order)).toEqual([1, 2])
    expect(groups[1].items.map((i) => i.sort_order)).toEqual([1, 2])
  })

  it('sin items devuelve vacio', () => {
    expect(groupItinerary([])).toEqual([])
  })
})

describe('ensureIdeaRelations', () => {
  it('arma contadores, voto propio, comentarios e itinerario', () => {
    const u1 = makeUser({ id: 'u_1' })
    const u2 = makeUser({ id: 'u_2' })
    const c1 = makeCategory({ id: 'c_1' })
    const idea = makeIdea({ id: 'i_1', category_id: 'c_1', user_id: 'u_1' })
    const votes = [
      makeVote({ id: 'v1', idea_id: 'i_1', user_id: 'u_2', reaction: '🔥' }),
      makeVote({ id: 'v2', idea_id: 'i_1', user_id: 'u_1', reaction: '❤️' }),
      makeVote({ id: 'v3', idea_id: 'i_1', user_id: 'u_2', reaction: '🤡' as never }),
    ]
    const comments = [
      makeComment({ id: 'cm1', idea_id: 'i_1' }),
      makeComment({ id: 'cm2', idea_id: 'i_1' }),
    ]

    const result = ensureIdeaRelations(
      idea,
      new Map([[u1.id, u1], [u2.id, u2]]),
      new Map([[c1.id, c1]]),
      votes,
      comments,
      new Set(['i_1']),
      'u_1',
    )

    expect(result.vote_counts).toEqual({ '🔥': 1, '❤️': 1, '😐': 0, '🙅': 0 })
    expect(result.my_vote).toBe('❤️')
    expect(result.comments_count).toBe(2)
    expect(result.in_itinerary).toBe(true)
    expect(result.category?.id).toBe('c_1')
    expect(result.proposer?.id).toBe('u_1')
    expect(result.votes).toHaveLength(3)
  })

  it('sin usuario logueado no hay voto propio', () => {
    const idea = makeIdea({ id: 'i_1' })
    const result = ensureIdeaRelations(idea, new Map(), new Map(), [], [], new Set(), null)
    expect(result.my_vote).toBeNull()
    expect(result.vote_counts).toEqual(emptyVoteCounts())
  })
})

describe('demoId', () => {
  it('genera ids con el prefijo pedido', () => {
    expect(demoId('t')).toMatch(/^t_[a-z0-9]+$/)
  })

  it('no repite ids', () => {
    expect(demoId('i')).not.toBe(demoId('i'))
  })
})
