import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { TripCard } from '@/components/trip/TripCard'
import { CreateTripModal } from '@/components/trip/CreateTripModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PushCard } from '@/components/feedback/PushCard'
import { useAuthStore } from '@/lib/state/auth'
import { useTripsStore } from '@/lib/state/trips'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { pluralize } from '@/lib/utils/format'

export function TripsHome() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const { trips, loadingTrips, refreshTrips, loadCategories } = useTripsStore()
  const [creating, setCreating] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let alive = true
    refreshTrips().catch(() => alive && setLoadError(true))
    void loadCategories().catch(() => {})
    return () => {
      alive = false
    }
  }, [refreshTrips, loadCategories])

  useAutoRefresh(() => {
    refreshTrips().catch(() => setLoadError(true))
  })

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {currentUser ? `${currentUser.emoji} ¡Hola, ${currentUser.name}!` : '¡Hola!'}
          </h1>
          <p className="mt-1 font-medium text-ink-soft">¿A dónde tiramos este año? Arranquemos a planear.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="shadow-pop">
          + Crear viaje
        </Button>
      </header>

      <PushCard />

      {loadingTrips ? (
        <LoadingState />
      ) : loadError ? (
        <EmptyState
          emoji="📡"
          title="No pudimos cargar los viajes"
          cta="Puede ser la conexión o que la app esté caída un ratito."
          actionLabel="Reintentar"
          onAction={() => {
            setLoadError(false)
            void refreshTrips().catch(() => setLoadError(true))
          }}
        />
      ) : trips.length === 0 ? (
        <EmptyState
          emoji="🏝️"
          title="No hay viajes todavía"
          cta="Creá el primero y juntemos al grupo para el próximo destino."
          actionLabel="+ Crear el primer viaje"
          onAction={() => setCreating(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <TripCard trip={trip} />
            </motion.div>
          ))}
          <button
            onClick={() => setCreating(true)}
            className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink/15 p-5 text-ink-soft transition-colors hover:border-coral/60 hover:text-coral"
          >
            <span className="text-3xl" aria-hidden>
              ✨
            </span>
            <span className="font-display font-bold">{pluralize(trips.length, 'viaje')} — sumá otro</span>
          </button>
        </div>
      )}

      <CreateTripModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}