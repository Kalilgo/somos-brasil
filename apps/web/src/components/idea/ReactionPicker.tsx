import { motion, AnimatePresence } from 'motion/react'
import type { Reaction } from '@/types/db'
import { REACTIONS } from '@/lib/utils/constants'
import { fireBurstAt } from '@/components/feedback/Confetti'
import { cn } from '@/lib/utils/cn'

export interface Reactor {
  user_id: string
  name: string
  emoji: string
  color: string
}

export interface ReactionPickerProps {
  counts: Record<Reaction, number>
  myVote: Reaction | null
  onVote: (reaction: Reaction) => void
  disabled?: boolean
  myUserId?: string
  reactors?: Partial<Record<Reaction, Reactor[]>>
}

const MAX_REACTORS = 6

export function ReactionPicker({
  counts,
  myVote,
  onVote,
  disabled,
  myUserId,
  reactors,
}: ReactionPickerProps) {
  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-3" role="group" aria-label="Reacciones">
      {REACTIONS.map(({ reaction, label }) => {
        const active = myVote === reaction
        const count = counts[reaction]
        const users = (reactors?.[reaction] ?? []).slice(0, MAX_REACTORS)
        const overflow = (reactors?.[reaction]?.length ?? 0) - users.length
        const names = (reactors?.[reaction] ?? []).map((u) =>
          u.user_id === myUserId ? `Vos (${u.name})` : u.name,
        )
        return (
          <div key={reaction} className="flex flex-col items-center gap-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              animate={active ? { scale: [1, 1.22, 1.12] } : {}}
              transition={{ duration: 0.28 }}
              disabled={disabled}
              onClick={(e) => {
                fireBurstAt(e.clientX, e.clientY)
                onVote(reaction)
              }}
              aria-label={`${label}${count ? `: ${count}` : ''}`}
              aria-pressed={active}
              className={cn(
                'relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2 font-display text-base shadow-sm transition-colors',
                'disabled:pointer-events-none disabled:opacity-50',
                'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
                active
                  ? 'border-ink bg-ink text-white shadow-md ring-2 ring-coral/70 ring-offset-2 ring-offset-white'
                  : 'border-ink/10 bg-white hover:border-ink/30',
              )}
            >
              <span aria-hidden>{reaction}</span>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={count}
                  initial={{ scale: 1.5, y: -5, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'min-w-3.5 text-sm font-bold tabular-nums',
                    active && 'text-mango',
                  )}
                >
                  {count > 0 ? count : ''}
                </motion.span>
              </AnimatePresence>
              {active && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 500 }}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-[11px] font-extrabold text-white shadow-card"
                  aria-hidden
                >
                  ✓
                </motion.span>
              )}
            </motion.button>

            {names.length > 0 && (
              <div
                className="flex max-w-28 items-center"
                role="list"
                aria-label={`Les pareció "${label}": ${names.join(', ')}`}
                title={names.join(', ')}
              >
                {users.map((u, i) => (
                  <span
                    key={u.user_id}
                    role="listitem"
                    aria-label={u.user_id === myUserId ? `Vos (${u.name})` : u.name}
                    className={cn(
                      'grid h-5 w-5 place-items-center overflow-hidden rounded-full text-[11px] leading-none ring-2 ring-white',
                      i > 0 && '-ml-1',
                      u.user_id === myUserId && 'ring-coral ring-2',
                    )}
                    style={{ backgroundColor: u.color, zIndex: MAX_REACTORS - i }}
                  >
                    {u.emoji}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="-ml-1 text-[11px] font-bold tabular-nums text-ink-soft">
                    +{overflow}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}