import { motion, AnimatePresence } from 'motion/react'
import type { Reaction } from '@/types/db'
import { REACTIONS } from '@/lib/utils/constants'
import { fireBurstAt } from '@/components/feedback/Confetti'
import { cn } from '@/lib/utils/cn'

export interface ReactionPickerProps {
  counts: Record<Reaction, number>
  myVote: Reaction | null
  onVote: (reaction: Reaction) => void
  disabled?: boolean
}

export function ReactionPicker({ counts, myVote, onVote, disabled }: ReactionPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Reacciones">
      {REACTIONS.map(({ reaction, label }) => {
        const active = myVote === reaction
        const count = counts[reaction]
        return (
          <motion.button
            key={reaction}
            type="button"
            whileTap={{ scale: 0.9 }}
            animate={
              active
                ? { scale: [1, 1.22, 1.12] }
                : {}
            }
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
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-[10px] font-extrabold text-white shadow-card"
                aria-hidden
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}