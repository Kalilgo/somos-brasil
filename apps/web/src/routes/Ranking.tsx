import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { motion } from 'motion/react'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { fireCelebration } from '@/components/feedback/Confetti'
import { useLeaderboardStore } from '@/lib/state/leaderboard'
import { toastSuccess } from '@/lib/state/toasts'
import type { LeaderboardResult } from '@/lib/data/types'
import { cn } from '@/lib/utils/cn'

const medals = ['🥇', '🥈', '🥉']

export function Ranking() {
  const { tripId } = useParams()
  const result = useLeaderboardStore((s) => s.result)
  const loading = useLeaderboardStore((s) => s.loading)
  const load = useLeaderboardStore((s) => s.load)
  const firedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!tripId) return
    void load(tripId).then(() => {
      const r = useLeaderboardStore.getState().result
      if (r && r.newly_earned.length > 0 && firedRef.current !== tripId) {
        firedRef.current = tripId
        fireCelebration(2)
        for (const n of r.newly_earned) {
          toastSuccess(
            `${n.badge?.emoji} ${n.badge?.name}: lo sumamos a la fila de ${userName(r, n.user_id)}`,
            n.badge?.emoji ?? '🏆',
          )
        }
      }
    })
  }, [tripId, load])

  if (loading && !result) return <LoadingState />

  if (!result || result.ranking.length === 0) {
    return (
      <EmptyState
        emoji="🏆"
        title="Sin ranking todavía"
        cta="Proponé, votá y comentá para prendér tu fueguito en el leaderboard."
      />
    )
  }

  const maxScore = Math.max(1, ...result.ranking.map((r) => r.score))

  const podium = result.ranking.slice(0, 3)
  const rest = result.ranking.slice(3)

  return (
    <div>
      <div className="mb-6 text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200 }}
          className="inline-block text-5xl"
          aria-hidden
        >
          🏆
        </motion.span>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">Ranking del grupo</h2>
        <p className="mt-1 font-medium text-ink-soft">
          Ideas ×3 + votos ×1 + comentarios ×2. El más activo se lleva el manaos 👑
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {podium.map((row, idx) => (
          <motion.div
            key={row.user_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={cn(
              'relative flex flex-col items-center rounded-3xl border bg-white p-5 text-center shadow-card',
              idx === 0 ? 'border-mango/60 bg-verde/8' : 'border-ink/5',
            )}
          >
            {idx === 0 && (
              <span className="absolute -top-3 rounded-full bg-mango px-3 py-0.5 font-display text-xs font-extrabold text-[#5c3d00] shadow-card">
                👑 El más activo
              </span>
            )}
            <span className="absolute left-4 top-4 text-3xl">{medals[idx]}</span>
            <Avatar user={row} size="xl" className="mt-1" />
            <p className="mt-2 font-display text-lg font-extrabold text-ink">{row.name}</p>
            <div className="mt-1 flex items-center gap-1">
              <span className="font-display text-2xl font-extrabold text-coral">{row.score}</span>
              <span className="text-xs font-bold text-ink-soft">pts</span>
            </div>
            <div className="mt-2 flex gap-2 text-xs font-bold text-ink-soft">
              <span>💡{row.ideas}</span>
              <span>🗳️{row.votes}</span>
              <span>💬{row.comments}</span>
              {row.streak_days > 0 && (
                <span className="text-sunset">🔥 {row.streak_days}°</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-2.5">
        {rest.map((row, idx) => (
          <div
            key={row.user_id}
            className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-3.5 shadow-card"
          >
            <span className="w-8 text-center font-display text-lg font-extrabold text-ink-soft">
              {idx + 4}
            </span>
            <Avatar user={row} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-ink">{row.name}</p>
                {row.streak_days > 0 && (
                  <span className="text-xs">
                    🔥 {row.streak_days}
                    <span className="sr-only"> días de racha</span>
                  </span>
                )}
              </div>
              <ProgressBar value={(row.score / maxScore) * 100} color={row.color} className="mt-1.5" />
              <p className="mt-1 text-xs font-bold text-ink-soft">
                {row.score} pts · 💡{row.ideas} · 🗳️{row.votes} · 💬{row.comments}
              </p>
            </div>
          </div>
        ))}
        {rest.length === 0 && (
          <p className="text-center text-sm font-medium text-ink-soft">
            Los otros 3 no llegaron al podio... todavía 😏
          </p>
        )}
      </div>

      <BadgesBoard result={result} />
    </div>
  )
}

function userName(result: LeaderboardResult, userId: string): string {
  return result.ranking.find((r) => r.user_id === userId)?.name ?? 'alguien'
}

function BadgesBoard({ result }: { result: LeaderboardResult }) {
  const byUser = new Map<string, typeof result.badges>()
  for (const b of result.badges) {
    const arr = byUser.get(b.user_id) ?? []
    arr.push(b)
    byUser.set(b.user_id, arr)
  }
  const allUsers = [...new Set([...result.ranking.map((r) => r.user_id), ...byUser.keys()])]

  return (
    <section>
      <h3 className="mb-3 font-display text-xl font-extrabold text-ink">🏅 Badges ganados</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {allUsers.map((userId) => {
          const user = result.ranking.find((r) => r.user_id === userId)
          const badges = byUser.get(userId) ?? []
          return (
            <div key={userId} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-card">
              <div className="mb-2 flex items-center gap-2.5">
                {user ? (
                  <Avatar user={user} size="sm" />
                ) : (
                  <Avatar user={null} size="sm" />
                )}
                <p className="font-display font-bold text-ink">{user?.name ?? '—'}</p>
              </div>
              {badges.length === 0 ? (
                <p className="text-xs font-medium text-ink-soft">
                  Todavía sin badges. ¡A mover la ruleta de ideas!
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <li
                      key={b.badge_id}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs font-bold"
                      style={
                        b.badge
                          ? { backgroundColor: `${b.badge.color}1F`, color: b.badge.color }
                          : undefined
                      }
                    >
                      <span aria-hidden>{b.badge?.emoji}</span>
                      {b.badge?.name}
                      {b.badge?.criteria && <span className="sr-only">: {b.badge.criteria}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}