import { Link } from 'react-router'
import { useLocation, useParams } from 'react-router'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'

const items = [
  { value: 'inicio', label: 'Inicio', emoji: '🏠' },
  { value: 'ideias', label: 'Ideas', emoji: '💡' },
  { value: 'itinerario', label: 'Itinerario', emoji: '🗓️' },
  { value: 'resumo', label: 'Resumen', emoji: '💰' },
  { value: 'ranking', label: 'Ranking', emoji: '🏆' },
] as const

export function BottomNav() {
  const { tripId } = useParams()
  const location = useLocation()
  const path = (location.pathname.split('/').pop() ?? '') as string
  const active = items.some((i) => i.value === path) ? path : 'inicio'

  return (
    <nav
      aria-label="Secciones del viaje"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/5 bg-cream/90 backdrop-blur-md sm:hidden"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around gap-1 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map((item) => {
          const isActive = item.value === active
          return (
            <Link
              key={item.value}
              prefetch="intent"
              to={item.value === 'inicio' ? `/viajes/${tripId}` : `/viajes/${tripId}/${item.value}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-coral/70',
                isActive ? 'text-ink' : 'text-ink-soft hover:text-ink/80 active:text-ink',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                  className="absolute inset-x-1.5 inset-y-0.5 rounded-2xl bg-ink/8"
                  aria-hidden
                />
              )}
              <span className="relative text-xl leading-none" aria-hidden>
                {item.emoji}
              </span>
              <span
                className={cn(
                  'relative max-w-full truncate font-display text-[11px] font-bold tracking-wide',
                  isActive ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}