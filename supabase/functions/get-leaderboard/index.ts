// Edge Runtime type definitions
import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { ipOf, rateAllowed } from '../_shared/rate.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Row {
  user_id: string
  ideas: number
  votes: number
  comments: number
  ideas_confirmed: number
  reactions_received: number
  categories_touched: number
  cheapest_ideas: number
  activity_days: string[]
}

interface LeaderRow {
  user_id: string
  name: string
  emoji: string
  color: string
  score: number
  ideas: number
  votes: number
  comments: number
  streak_days: number
}

// Espejo de badgeRules en apps/web/src/lib/data/logic.ts
const BADGE_RULES: { key: string; earned: (r: Row) => boolean }[] = [
  { key: 'explorador', earned: (r) => r.categories_touched >= 4 },
  { key: 'cazador', earned: (r) => r.cheapest_ideas >= 3 },
  { key: 'turbina', earned: (r) => r.votes >= 5 },
  { key: 'impulsor', earned: (r) => r.ideas_confirmed >= 3 },
  { key: 'radio', earned: (r) => r.comments >= 5 },
]

function activityStreak(days: string[]): number {
  const set = new Set(days.filter(Boolean))
  if (set.size === 0) return 0
  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...set].sort()
  const last = sorted[sorted.length - 1]
  const offset = today < last ? 0 : 1
  let streak = 0
  const cursor = new Date(today + 'T00:00:00Z')
  cursor.setUTCDate(cursor.getUTCDate() - offset)
  for (let i = 0; i < 400; i++) {
    const key = cursor.toISOString().slice(0, 10)
    if (set.has(key)) {
      streak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const ip = ipOf(req)
    if (!(await rateAllowed(ctx.supabaseAdmin, `lb:ip:${ip}`, 30, 60))) {
      return Response.json({ message: 'Vas muy rápido, esperá un toque.' }, { status: 429 })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `lb:ip:${ip}`, 300, 3600))) {
      return Response.json({ message: 'Llegaste al límite de consultas de esta hora.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({})) as { trip_id?: unknown }
    const { trip_id } = body

    if (typeof trip_id !== 'string' || !UUID_RE.test(trip_id)) {
      return Response.json({ message: 'trip_id inválido' }, { status: 400 })
    }

    const { data: trip } = await ctx.supabaseAdmin
      .from('trips')
      .select('id')
      .eq('id', trip_id)
      .maybeSingle()
    if (!trip) {
      return Response.json({ message: 'El viaje no existe' }, { status: 404 })
    }

    const { data: rows, error: rowsError } = await ctx.supabaseAdmin.rpc('get_trip_leaderboard', {
      p_trip_id: trip_id,
    })
    if (rowsError) {
      return Response.json({ message: rowsError.message }, { status: 500 })
    }

    const [usersRes, badgesRes, earnedRes] = await Promise.all([
      ctx.supabaseAdmin.from('users').select('id, name, emoji, color'),
      ctx.supabaseAdmin.from('badges').select('id, key, name, emoji'),
      ctx.supabaseAdmin.from('user_badges').select('user_id, badge_id'),
    ])

    const userById = new Map((usersRes.data ?? []).map((u) => [u.id as string, u]))
    const badgeByKey = new Map((badgesRes.data ?? []).map((b) => [b.key as string, b]))
    const earnedSet = new Set((earnedRes.data ?? []).map((e) => `${e.user_id}:${e.badge_id}`))

    const ranking: LeaderRow[] = (rows as Row[]).map((r) => {
      const u = userById.get(r.user_id)
      const score = r.ideas * 3 + r.votes * 1 + r.comments * 2 + r.reactions_received * 1
      return {
        user_id: r.user_id,
        name: u?.name ?? '???',
        emoji: u?.emoji ?? '👤',
        color: u?.color ?? '#94a3b8',
        score,
        ideas: r.ideas,
        votes: r.votes,
        comments: r.comments,
        streak_days: activityStreak(r.activity_days),
      }
    }).sort((a, b) => b.score - a.score || b.ideas - a.ideas || a.name.localeCompare(b.name))

    const newly: { user_id: string; badge: { id: string; key: string; name: string; emoji: string } }[] = []
    const toInsert: { user_id: string; badge_id: string }[] = []

    for (const r of rows as Row[]) {
      for (const rule of BADGE_RULES) {
        const badge = badgeByKey.get(rule.key)
        if (!badge || earnedSet.has(`${r.user_id}:${badge.id}`)) continue
        if (!rule.earned(r)) continue
        toInsert.push({ user_id: r.user_id, badge_id: badge.id as string })
        earnedSet.add(`${r.user_id}:${badge.id}`)
        newly.push({ user_id: r.user_id, badge: badge as any })
      }
    }

    if (toInsert.length > 0) {
      await ctx.supabaseAdmin.from('user_badges').upsert(toInsert, {
        onConflict: 'user_id,badge_id',
        ignoreDuplicates: true,
      })
    }

    const badges = Array.from(earnedSet)
      .map((keyId) => {
        const [uid, bid] = keyId.split(':')
        return { user_id: uid, badge_id: bid, badge: badgeByKey.get(bid) ?? null }
      })
      .filter((b) => b.badge && userById.has(b.user_id))

    return Response.json({
      ranking,
      badges,
      newly_earned: newly.map((n) => ({ user_id: n.user_id, badge_id: n.badge.id, badge: n.badge })),
    })
  }),
}