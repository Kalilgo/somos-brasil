import { useParams } from 'react-router'
import { useTripsStore } from '@/lib/state/trips'
import { isUuid } from '@/lib/utils/validate'

/**
 * tripId validado. Devuelve null si el param no es un UUID, para que ningun
 * consumidor pueda llegar a una query con un id arbitrario. TripLayout hace lo mismo
 * para el render; esto cubre a los que lo llaman desde un modal o una seccion.
 */
export function useTripParams() {
  const params = useParams<{ tripId: string }>()
  const tripId = isUuid(params.tripId) ? params.tripId : null
  const trip = useTripsStore((s) => (tripId ? s.currentTrip : null))
  return { tripId, trip: trip && trip.id === tripId ? trip : null }
}
