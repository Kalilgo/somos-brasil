import type {
  Badge,
  Category,
  Idea,
  IdeaComment,
  IdeaWithRelations,
  LeaderboardRow,
  Trip,
  TripSummary,
  UserBadge,
  AppUser,
  Vote,
} from '@/types/db'
import type { MemberPlan } from './types'
import { SCORE_WEIGHTS } from '@/lib/utils/constants'
import { memberPresentDays } from '@/lib/utils/tripDates'

/**
 * Los cuatro contadores en cero. Se exporta porque una idea recien creada entra al
 * store antes de que existan sus votos, y ese momento tiene que ser un objeto
 * completo: si `vote_counts` falta, `counts['🔥']` tira la app abajo.
 */
export function emptyVoteCounts(): IdeaWithRelations['vote_counts'] {
  return { '🔥': 0, '❤️': 0, '😐': 0, '🙅': 0 }
}

export function computeSummary(
  ideas: Idea[],
  categories: Category[],
  trip: Trip,
  members: MemberPlan[],
  users: AppUser[],
): TripSummary {
  const confirmed = ideas.filter((i) => i.status === 'confirmed')

  const totalsPerCategory = categories
    .map((c) => {
      const items = confirmed.filter((i) => i.category_id === c.id)
      const priced = items
        .map((i) => i.price)
        .filter((p): p is number => p != null)
      const total = priced.length ? priced.reduce((a, b) => a + b, 0) : null
      return {
        category_id: c.id,
        slug: c.slug,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        total,
        count: items.length,
      }
    })
    .filter((c) => c.count > 0)

  const byCurrency = new Map<string, number>()
  for (const i of confirmed) {
    if (i.price == null) continue
    byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + i.price)
  }
  const totalsPerCurrency = [...byCurrency.entries()].map(([currency, total]) => ({
    currency: currency as Trip['currency'],
    total,
  }))

  const membersWithUser = members.map((m) => ({
    plan: m,
    user: users.find((u) => u.id === m.user_id) ?? null,
  }))
  const memberRows = membersWithUser.map(({ plan, user }) => ({
    user_id: plan.user_id,
    name: user?.name ?? 'Integrante',
    emoji: user?.emoji ?? '🤷',
    color: user?.color ?? '#000000',
    arrival_date: plan.arrival_date,
    departure_date: plan.departure_date,
    days_present: user ? memberPresentDays(plan, trip) : null,
  }))
  const payerTotalDays = memberRows.reduce(
    (acc, m) => acc + (m.days_present != null && m.days_present > 0 ? m.days_present : 0),
    0,
  )

  const perPerson = totalsPerCurrency.map((t) => ({
    currency: t.currency,
    total: t.total,
    per_day: payerTotalDays > 0 ? t.total / payerTotalDays : null,
  }))

  return {
    totals_per_category: totalsPerCategory,
    totals_per_currency: totalsPerCurrency,
    per_person: perPerson,
    payer_total_days: payerTotalDays,
    members: memberRows,
    confirmed_count: confirmed.length,
    member_count: members.length,
    trip_currency: trip.currency,
  }
}

interface BadgeRule {
  key: string
  earned: (stats: PerUserStats) => boolean
}

interface PerUserStats {
  ideasProposed: number
  votesCast: number
  reactionsReceived: number
  commentsMade: number
  ideasConfirmed: number
  categoriesTouched: number
  cheapestIdeas: number
  activityDays: Set<string>
}

function userStats(
  user: AppUser,
  ideas: Idea[],
  votes: Vote[],
  comments: IdeaComment[],
  categoriesByIdea: Map<string, Category>,
): PerUserStats {
  const mine = ideas.filter((i) => i.user_id === user.id)
  const cheapestByCat = new Map<string, number>()
  for (const i of ideas) {
    if (i.price == null) continue
    const cur = cheapestByCat.get(i.category_id)
    if (cur == null || i.price < cur) cheapestByCat.set(i.category_id, i.price)
  }
  const cheapestIdeas = mine.filter((i) => i.price != null && cheapestByCat.get(i.category_id) === i.price)
    .length

  const activityDays = new Set<string>()
  const addDay = (iso: string) => activityDays.add(new Date(iso).toISOString().slice(0, 10))
  mine.forEach((i) => addDay(i.created_at))
  const myVotes = votes.filter((v) => v.user_id === user.id)
  myVotes.forEach((v) => addDay(v.created_at))
  comments
    .filter((c) => c.user_id === user.id)
    .forEach((c) => addDay(c.created_at))

  const ideaOwner = new Map(ideas.map((i) => [i.id, i.user_id]))
  const votesToOthers = myVotes.filter((v) => ideaOwner.get(v.idea_id) !== user.id).length
  const reactionsReceived = votes.filter(
    (v) => ideaOwner.get(v.idea_id) === user.id && v.user_id !== user.id,
  ).length

  return {
    ideasProposed: mine.length,
    votesCast: votesToOthers,
    reactionsReceived,
    commentsMade: comments.filter((c) => c.user_id === user.id).length,
    ideasConfirmed: mine.filter((i) => i.status === 'confirmed').length,
    categoriesTouched: new Set(mine.map((i) => i.category_id).filter((id) => categoriesByIdea.get(id)?.id)).size,
    cheapestIdeas,
    activityDays,
  }
}

function activityStreak(days: Set<string>): number {
  const sorted = [...days].sort()
  if (!sorted.length) return 0
  const today = new Date().toISOString().slice(0, 10)
  const offset = (today < sorted[sorted.length - 1] ? 0 : 1)
  let streak = 0
  const cursor = new Date(today)
  cursor.setDate(cursor.getDate() - offset)
  let guard = 0
  while (guard < 400) {
    const key = cursor.toISOString().slice(0, 10)
    if (days.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else break
    guard++
  }
  return streak
}

export function computeLeaderboard(
  users: AppUser[],
  ideas: Idea[],
  votes: Vote[],
  comments: IdeaComment[],
  categories: Category[],
  badges: Badge[],
  earned: UserBadge[],
  activeUserIds: string[],
): {
  ranking: LeaderboardRow[]
  eligible: { user: AppUser; badge: Badge }[]
  newly: { user: AppUser; badge: Badge }[]
} {
  const categoriesByIdea = new Map(ideas.map((i) => [i.category_id, categories.find((c) => c.id === i.category_id)!]))

  const rows: LeaderboardRow[] = []
  const eligible: { user: AppUser; badge: Badge }[] = []

  for (const user of users) {
    if (!activeUserIds.includes(user.id)) continue
    const s = userStats(user, ideas, votes, comments, categoriesByIdea)
    rows.push({
      user_id: user.id,
      name: user.name,
      emoji: user.emoji,
      color: user.color,
      score:
        s.ideasProposed * SCORE_WEIGHTS.ideas +
        s.votesCast * SCORE_WEIGHTS.votes +
        s.reactionsReceived * SCORE_WEIGHTS.received +
        s.commentsMade * SCORE_WEIGHTS.comments,
      ideas: s.ideasProposed,
      votes: s.votesCast,
      comments: s.commentsMade,
      streak_days: activityStreak(s.activityDays),
    })

    for (const badge of badges) {
      const rule = badgeRules.get(badge.key)
      if (rule && rule.earned(s)) eligible.push({ user, badge })
    }
  }

  rows.sort((a, b) => b.score - a.score || b.ideas - a.ideas)

  const earnedKeys = new Set(earned.map((e) => e.badge_id))
  const newly = eligible.filter(
    (e) => !earnedKeys.has(e.badge.id) && activeUserIds.includes(e.user.id),
  )

  return { ranking: rows, eligible, newly }
}

export const badgeRules = new Map<string, BadgeRule>([
  [
    'explorador',
    {
      key: 'explorador',
      earned: (s) => s.categoriesTouched >= 4,
    },
  ],
  [
    'cazador',
    { key: 'cazador', earned: (s) => s.cheapestIdeas >= 3 },
  ],
  ['turbina', { key: 'turbina', earned: (s) => s.votesCast >= 5 }],
  ['impulsor', { key: 'impulsor', earned: (s) => s.ideasConfirmed >= 3 }],
  ['radio', { key: 'radio', earned: (s) => s.commentsMade >= 5 }],
])

export function groupItinerary(
  items: { day_number: number; sort_order: number }[],
): { day_number: number; items: { day_number: number; sort_order: number }[] }[] {
  const byDay = new Map<number, { day_number: number; sort_order: number }[]>()
  for (const it of items) {
    const arr = byDay.get(it.day_number) ?? []
    arr.push(it)
    byDay.set(it.day_number, arr)
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day_number, list]) => ({
      day_number,
      items: list.sort((a, b) => a.sort_order - b.sort_order),
    }))
}

export function ensureIdeaRelations(
  idea: Idea,
  userById: Map<string, AppUser>,
  categoryById: Map<string, Category>,
  votes: Vote[],
  comments: IdeaComment[],
  itineraryIdeaIds: Set<string>,
  myUserId?: string | null,
): IdeaWithRelations {
  const ideaVotes = votes.filter((v) => v.idea_id === idea.id)
  const voteCounts = emptyVoteCounts()
  // `if` y no `+=`: si alguna vez aparece una reacción que no está en REACTIONS
  // (la base la tiene como texto libre), `undefined + 1` deja NaN en el contador
  // y la tarjeta muestra "NaN" sin avisar.
  for (const v of ideaVotes) {
    if (v.reaction in voteCounts) voteCounts[v.reaction] += 1
  }
  const myVote = myUserId ? ideaVotes.find((v) => v.user_id === myUserId)?.reaction ?? null : null
  return {
    ...idea,
    category: categoryById.get(idea.category_id) ?? null,
    proposer: userById.get(idea.user_id) ?? null,
    votes: ideaVotes,
    vote_counts: voteCounts,
    comments_count: comments.filter((c) => c.idea_id === idea.id).length,
    my_vote: myVote,
    in_itinerary: itineraryIdeaIds.has(idea.id),
  }
}

export const demoId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`