import { Link } from 'react-router'
import { useLocation, useParams } from 'react-router'
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
              to={item.value === 'inicio' ? `/viajes/${tripId}` : `/viajes/${tripId}/${item.value}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 transition-colors',
                'outline-none focus-visible:ring-2 focus-visible:ring-coral/70',
                isActive ? 'bg-ink/8 text-ink' : 'text-ink-soft hover:bg-ink/4 active:bg-ink/6',
              )}
            >
              <span className="text-xl leading-none" aria-hidden>
                {item.emoji}
              </span>
              <span
                className={cn(
                  'max-w-full truncate font-display text-xs font-bold tracking-wide',
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