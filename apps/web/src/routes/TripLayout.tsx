import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { TripHeader } from '@/components/trip/TripHeader'
import { SectionNav } from '@/components/trip/SectionNav'
import { BottomNav } from '@/components/layout/BottomNav'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { SyncBadge } from '@/components/feedback/SyncBadge'
import { PageTransition } from '@/components/layout/PageTransition'
import { useTripsStore } from '@/lib/state/trips'
import { useIdeasStore } from '@/lib/state/ideas'
import { useItineraryStore } from '@/lib/state/itinerary'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { preloadAllSections } from '@/routes/lazyRoutes'
import { isUuid } from '@/lib/utils/validate'

export function TripLayout() {
  const params = useParams()
  // El tripId de la URL se valida acá, una sola vez, y es el único lugar por donde
  // pasa: todas las secciones cuelgan de este layout. Antes el valor crudo iba
  // derecho a las queries, y un id que no es UUID (un link cortado, una typo, un
  // escaneo de bots) terminaba en un error de Postgres en vez de un 404.
  const tripId = isUuid(params.tripId) ? params.tripId : null
  const navigate = useNavigate()
  const trip = useTripsStore((s) => s.currentTrip)
  const members = useTripsStore((s) => (tripId ? s.membersByTrip[tripId] : undefined))
  const loadingTripId = useTripsStore((s) => s.loadingTripId)
  const loadTrip = useTripsStore((s) => s.loadTrip)
  const loadMembers = useTripsStore((s) => s.loadMembers)
  const loadIdeas = useIdeasStore((s) => s.loadIdeas)
  const ideasLoadedAt = useIdeasStore((s) => s.loadedAt)
  const ideasLoading = useIdeasStore((s) => s.loading)
  const loadItinerary = useItineraryStore((s) => s.load)
  const itinLoadedAt = useItineraryStore((s) => s.loadedAt)
  const [notFound, setNotFound] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useDocumentTitle(trip && trip.id === tripId ? trip.name : null)

  useEffect(() => {
    if (!tripId) return
    // oxlint-disable-next-line react/set-state-in-effect -- reset the error flags on navigation
    setFailed(false)
    // oxlint-disable-next-line react/set-state-in-effect -- reset the error flags on navigation
    setNotFound(false)
    loadTrip(tripId)
      .then((t) => {
        if (!t) setNotFound(true)
        else void loadMembers(tripId).catch(() => {})
      })
      .catch(() => setFailed(true))
  }, [tripId, loadTrip, loadMembers, attempt])

  const refreshGroupData = () => {
    if (!tripId) return
    void loadIdeas(tripId, true)
    void loadItinerary(tripId, true)
  }

  // En desktop el hover de las tabs ya precarga, en mobile no existe hover:
  // bajamos las secciones en idle al abrir el viaje.
  useEffect(() => {
    const run = () => preloadAllSections()
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 3_000 })
      return () => cancelIdleCallback(id)
    }
    const id = window.setTimeout(run, 1_200)
    return () => window.clearTimeout(id)
  }, [])

  useAutoRefresh(() => {
    if (tripId) void loadMembers(tripId).catch(() => {})
    refreshGroupData()
  }, Boolean(trip))

  if (failed) {
    return (
      <EmptyState
        as="h2"
        emoji="📡"
        title="No pudimos cargar el viaje"
        cta="Puede ser la conexión. Reintentá y seguimos."
        actionLabel="Reintentar"
        onAction={() => {
          setFailed(false)
          setAttempt((n) => n + 1)
        }}
      />
    )
  }

  // Un tripId que no es UUID nunca se consulta (el efecto de carga sale temprano con
  // tripId === null), asi que se resuelve acá como "no existe" en vez de dejar el
  // loading girando para siempre.
  if (notFound || !tripId) {
    return (
      <EmptyState
        as="h2"
        emoji="🦤"
        title="No encontramos ese viaje"
        cta="Puede que lo hayan borrado o que la URL tenga un error. Volvé a la lista y elegí otro."
        actionLabel="Volver a mis viajes"
        onAction={() => navigate('/viajes')}
      />
    )
  }

  const loading = !trip || trip.id !== tripId || loadingTripId === tripId

  return (
    <div>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <TripHeader trip={trip} members={members ?? []} />
          <SectionNav className="hidden sm:flex" />
          <SyncBadge
            loadedAt={Math.max(ideasLoadedAt, itinLoadedAt)}
            onRefresh={refreshGroupData}
            busy={ideasLoading}
          />
          <div className="mt-5">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
          <BottomNav />
        </>
      )}
    </div>
  )
}
