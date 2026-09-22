import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import type { Trip } from '@/types/db'
import { timeAgo } from '@/lib/utils/format'

export function TripCard({ trip }: { trip: Trip }) {
  const range = (() => {
    if (!trip.start_date && !trip.end_date) return 'Fechas por definir'
    if (trip.start_date && trip.end_date) {
      const start = new Date(`${trip.start_date}T00:00:00`)
      const end = new Date(`${trip.end_date}T00:00:00`)
      const f = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
      return `${f(start)} → ${f(end)}`
    }
    return trip.start_date ?? trip.end_date ?? ''
  })()

  return (
    <Link to={`/viajes/${trip.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-coral/70 rounded-3xl">
      <CardClickableInner>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-bold text-ink">{trip.name}</h3>
            {trip.description && (
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink-soft">
                {trip.description}
              </p>
            )}
          </div>
          <span className="mt-1 text-2xl" aria-hidden>
            {trip.status === 'confirmed' ? '✅' : trip.status === 'done' ? '🏁' : '🗺️'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge tone="category">📅 {range}</Badge>
          <Badge tone="category">💵 {trip.currency}</Badge>
          <Badge tone={trip.status === 'confirmed' ? 'confirmed' : 'default'}>
            {trip.status === 'confirmed' ? 'Confirmado' : trip.status === 'done' ? 'Terminado' : 'Planeando'}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-soft">
            Actualizado {timeAgo(trip.updated_at)}
          </span>
          <span className="font-display text-sm font-bold text-coral">Entrar →</span>
        </div>
      </CardClickableInner>
    </Link>
  )
}

function CardClickableInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full rounded-3xl border border-ink/5 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg">
      {children}
    </div>
  )
}