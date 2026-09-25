import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { LOADING_MESSAGES } from '@/lib/utils/constants'

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <motion.div
        className="flex gap-2"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
      >
        {['🌴', '🦜', '🏖️'].map((e, i) => (
          <span
            key={i}
            className="text-4xl"
            style={{ animationDelay: `${i * 0.15}s` }}
            aria-hidden
          >
            {e}
          </span>
        ))}
      </motion.div>
      <p className="font-display text-lg font-semibold text-ink">{LOADING_MESSAGES[idx]}</p>
      <p className="sr-only">{label}</p>
    </div>
  )
}