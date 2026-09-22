import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { motion } from 'motion/react'
import type { ItineraryRow } from '@/lib/data/types'
import { useItineraryStore } from '@/lib/state/itinerary'
import { useIdeasStore } from '@/lib/state/ideas'
import { useTripsStore } from '@/lib/state/trips'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'

export function Itinerary() {
  const { tripId } = useParams()
  const view = useItineraryStore((s) => s.view)
  const load = useItineraryStore((s) => s.load)
  const remove = useItineraryStore((s) => s.remove)
  const move = useItineraryStore((s) => s.move)
  const ideas = useIdeasStore((s) => s.ideas)
  const loadIdeas = useIdeasStore((s) => s.loadIdeas)
  const categories = useTripsStore((s) => s.categories)

  useEffect(() => {
    if (tripId) {
      void load(tripId)
      void loadIdeas(tripId)
    }
  }, [tripId, load, loadIdeas])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const confirmedOutside = useMemo(
    () =>
      ideas.filter(
        (i) => i.status === 'confirmed' && !i.in_itinerary && i.trip_id === tripId,
      ),
    [ideas, tripId],
  )

  const moveToDay = async (item: ItineraryRow, targetDay: number) => {
    if (!tripId) return
    const siblings = view.days.find((d) => d.day_number === targetDay)?.items.length ?? 0
    try {
      await move(item.id, targetDay, siblings + 1)
      toastSuccess(`Movida al día ${targetDay} 📅`)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo mover')
    }
  }

  const swapWithinDay = async (item: ItineraryRow, direction: -1 | 1) => {
    const day = view.days.find((d) => d.day_number === item.day_number)
    if (!day) return
    const idx = day.items.findIndex((i) => i.id === item.id)
    const other = day.items[idx + direction]
    if (!other) return
    try {
      await move(item.id, item.day_number, other.sort_order)
      await move(other.id, other.day_number, item.sort_order)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo reordenar')
    }
  }

  return (
    <div>
      {confirmedOutside.length > 0 && (
        <div className="mb-5 rounded-3xl bg-mango/20 p-4">
          <p className="mb-2 font-display text-sm font-extrabold text-[#8a5a00]">
            ⭐ Tenés ideas confirmadas sin agendar
          </p>
          <div className="flex flex-wrap gap-2">
            {confirmedOutside.map((idea) => (
              <button
                key={idea.id}
                onClick={() => {
                  if (!tripId) return
                  const day = Math.max(1, view.days.length)
                  useItineraryStore
                    .getState()
                    .add(tripId, idea.id, day)
                    .then(() => toastSuccess(`"${idea.title}" al día ${day} 📅`))
                    .catch((e: unknown) =>
                      toastError(e instanceof Error ? e.message : 'No se pudo agregar'),
                    )
                }}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-display text-sm font-bold text-ink shadow-card transition-transform active:scale-95"
              >
                <span aria-hidden>{idea.category?.emoji}</span>
                {idea.title}
                <span className="text-verde">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view.days.length === 0 && !confirmedOutside.length ? (
        <EmptyState
          emoji="🗓️"
          title="El itinerario está en blanco"
          cta="Confirmá ideas y andá armando los días del viaje."
        />
      ) : view.days.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="Todavía no agendamos nada"
          cta="Confirmá ideas y agregalas a los días."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {view.days.map((day) => (
            <section key={day.day_number}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink font-display text-lg font-extrabold text-white shadow-card">
                  {day.day_number}
                </span>
                <h3 className="font-display text-xl font-extrabold text-ink">Día {day.day_number}</h3>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              <ol className="flex flex-col gap-2.5">
                {day.items.map((item) => {
                  const cat = item.idea ? categoryById.get(item.idea.category_id) : undefined
                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-2xl border border-ink/5 bg-white p-3.5 shadow-card"
                    >
                      <span
                        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg"
                        style={{ backgroundColor: cat ? `${cat.color}22` : '#00000010' }}
                        aria-hidden
                      >
                        {cat?.emoji ?? '❔'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold leading-snug text-ink">
                          {item.idea?.title ?? 'Idea eliminada'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {cat && <Badge tone="category">{cat.name}</Badge>}
                          {item.idea?.price != null && (
                            <span className="font-display text-xs font-bold text-verde-dark">
                              💵 {item.idea.price} {item.idea.currency}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-xs font-medium text-ink-soft">{item.notes}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="flex gap-1">
                          <button
                          onClick={() => void swapWithinDay(item, -1)}
                          aria-label="Subir"
                          className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 text-sm text-ink-soft hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => void swapWithinDay(item, 1)}
                          aria-label="Bajar"
                          className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 text-sm text-ink-soft hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => void remove(item.id).catch(() => {})}
                          aria-label="Sacar del itinerario"
                          className="grid h-7 w-7 place-items-center rounded-lg bg-danger/10 text-sm text-danger hover:bg-danger/20 focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:outline-none"
                        >
                          ✕
                        </button>
                      </div>
                      <select
                        aria-label={`Mover ${item.idea?.title ?? ''} a otro día`}
                        name="move-day"
                        autoComplete="off"
                        value={item.day_number}
                        onChange={(e) => void moveToDay(item, Number(e.target.value))}
                        className="cursor-pointer rounded-lg border border-ink/10 bg-white px-2 py-1 text-xs font-bold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-coral/70 focus:border-coral"
                      >
                        {view.days.map((d) => (
                          <option key={d.day_number} value={d.day_number}>
                            Día {d.day_number}
                          </option>
                        ))}
                      </select>
                      </div>
                    </motion.li>
                  )
                })}

                {day.items.length === 0 && (
                  <p className="text-sm font-medium text-ink-soft">Este día no tiene planes todavía.</p>
                )}
              </ol>
            </section>
          ))}

          <div className="rounded-2xl bg-ink/5 p-4 text-center">
            <p className="text-sm font-medium text-ink-soft">
              ¿Te falta un día? Sumá una idea confirmada y elegí el día.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                if (confirmedOutside.length) {
                  const idea = confirmedOutside[0]
                  if (!tripId) return
                  useItineraryStore
                    .getState()
                    .add(tripId, idea.id, view.days.length + 1)
                    .catch((e: unknown) =>
                      toastError(e instanceof Error ? e.message : 'No se pudo agregar'),
                    )
                } else {
                  toastError('No hay ideas confirmadas para agendar todavía')
                }
              }}
            >
              + Abrir nuevo día
            </Button>
            <p className={cn('mt-2 text-xs text-ink-soft')}>
              {confirmedOutside.length
                ? `${confirmedOutside.length} confirmadas esperando agendarse`
                : 'Confirmá ideas desde la pestaña de Ideas para agendar.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}