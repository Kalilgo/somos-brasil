import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useItineraryStore } from '@/lib/state/itinerary'
import { useTripParams } from '@/hooks/useTripParams'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { fireMiniConfetti } from '@/components/feedback/Confetti'

export function AddToItineraryModal({
  open,
  onClose,
  ideaId,
}: {
  open: boolean
  onClose: () => void
  ideaId: string
}) {
  const { tripId } = useTripParams()
  const view = useItineraryStore((s) => s.view)
  const add = useItineraryStore((s) => s.add)

  const lastDay = Math.max(1, view.days.reduce((m, d) => Math.max(m, d.day_number), 0))
  const dayOptions = Array.from({ length: Math.max(lastDay + 2, 8) }, (_, i) => i + 1)
  const [day, setDay] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- preseleccionar el último día al abrir el modal
    if (open) setDay(lastDay)
  }, [open, lastDay])

  const submit = async () => {
    if (!tripId) return
    setSubmitting(true)
    try {
      await add(tripId, ideaId, day)
      fireMiniConfetti()
      toastSuccess(`Agregada al día ${day} del itinerario 📅`)
      onClose()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo agregar al itinerario')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar al itinerario"
      emoji="🗓️"
      size="sm"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={submit} loading={submitting}>
            Agendar 📅
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 py-2">
        <p className="text-sm font-medium text-ink-soft">
          ¿En qué día del viaje entra esta joyita? Elegí el número y la ubicamos.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir día del itinerario">
          {dayOptions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              aria-pressed={day === d}
              className={
                'h-11 min-w-11 rounded-2xl border-2 px-3 font-display text-lg font-bold transition ' +
                'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none ' +
                (day === d
                  ? 'scale-[1.05] border-transparent bg-ink text-white shadow-md'
                  : 'border-ink/10 bg-white text-ink-soft hover:border-ink/30')
              }
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-soft">
          Podés reordenarla después desde la vista de itinerario.
        </p>
      </div>
    </Modal>
  )
}