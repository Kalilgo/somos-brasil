import { useParams } from 'react-router'
import { useTripsStore } from '@/lib/state/trips'

export function useTripParams() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripsStore((s) => (tripId ? s.currentTrip : null))
  return { tripId: tripId ?? null, trip }
}