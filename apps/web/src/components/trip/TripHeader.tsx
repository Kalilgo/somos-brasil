import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { AppUser, Trip } from '@/types/db'
import { formatTripRange, pluralize } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function TripHeader({
  trip,
  members,
  className,
}: {
  trip: Trip
  members: AppUser[]
  className?: string
}) {
  return (
    <section className={cn('mb-5', className)}>
      <Link
        to="/viajes"
        className="mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
      >
        ← Mis viajes
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {trip.name} {trip.status === 'done' ? '🎉' : ''}
          </h1>
          {trip.description && (
            <p className="mt-1 max-w-xl text-sm font-medium text-ink-soft sm:text-base">
              {trip.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="category" className="text-sm">
              📅 {formatTripRange(trip.start_date, trip.end_date)}
            </Badge>
            <Badge tone="category" className="text-sm">
              💵 {trip.currency}
            </Badge>
            <Badge tone={trip.status === 'confirmed' ? 'confirmed' : 'default'} className="text-sm">
              {trip.status === 'done' ? '🏁 Viaje terminado' : trip.status === 'confirmed' ? '✅ Viaje confirmado' : '📋 Planeando'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex -space-x-2.5" aria-label="Miembros">
            {members.map((m) => (
              <Avatar key={m.id} user={m} size="md" title={m.name} className="border-2 border-cream" />
            ))}
          </div>
          <span className="font-display text-xs font-semibold text-ink-soft">
            {pluralize(members.length, 'integrante')}
          </span>
        </div>
      </div>
    </section>
  )
}