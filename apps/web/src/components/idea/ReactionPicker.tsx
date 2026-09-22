import { motion, AnimatePresence } from 'motion/react'
import type { Reaction } from '@/types/db'
import { REACTIONS } from '@/lib/utils/constants'
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
            whileTap={{ scale: 1.25 }}
            animate={active ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.25 }}
            disabled={disabled}
            onClick={() => onVote(reaction)}
            aria-label={`${label}${count ? `: ${count}` : ''}`}
            aria-pressed={active}
            className={cn(
              'flex min-w-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-display text-base transition-colors',
              'disabled:pointer-events-none disabled:opacity-50',
              'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
              active
                ? 'border-transparent bg-ink text-white shadow-md'
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
                className="min-w-3.5 text-sm font-bold tabular-nums"
              >
                {count > 0 ? count : ''}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}