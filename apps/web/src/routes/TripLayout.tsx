import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router'
import { TripHeader } from '@/components/trip/TripHeader'
import { SectionNav } from '@/components/trip/SectionNav'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useTripsStore } from '@/lib/state/trips'

export function TripLayout() {
  const { tripId } = useParams()
  const trip = useTripsStore((s) => s.currentTrip)
  const members = useTripsStore((s) => (tripId ? s.membersByTrip[tripId] : undefined))
  const loadingTripId = useTripsStore((s) => s.loadingTripId)
  const loadTrip = useTripsStore((s) => s.loadTrip)
  const loadMembers = useTripsStore((s) => s.loadMembers)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!tripId) return
    // oxlint-disable-next-line react/set-state-in-effect -- reset the "failed" flag on navigation
    setFailed(false)
    loadTrip(tripId)
      .then((t) => {
        if (!t) setFailed(true)
        else void loadMembers(tripId).catch(() => {})
      })
      .catch(() => setFailed(true))
  }, [tripId, loadTrip, loadMembers])

  if (failed) {
    return (
      <EmptyState
        emoji="🦤"
        title="No encontramos ese viaje"
        cta="Puede que lo hayan borrado o que la URL tenga un error. Volvé a la lista y elegí otro."
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
          <SectionNav />
          <div className="mt-5">
            <Outlet />
          </div>
        </>
      )}
    </div>
  )
}