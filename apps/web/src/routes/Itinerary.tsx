import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { motion } from 'motion/react'
import type { ItineraryRow } from '@/lib/data/types'
import { useItineraryStore } from '@/lib/state/itinerary'
import { useIdeasStore } from '@/lib/state/ideas'
import { useTripsStore } from '@/lib/state/trips'
import { useAuthStore } from '@/lib/state/auth'
import { useTripParams } from '@/hooks/useTripParams'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { fireMiniConfetti } from '@/components/feedback/Confetti'
import { dayLabel, memberPresentDays, memberPresentDayNumbers, formatMemberRange } from '@/lib/utils/tripDates'
import { cn } from '@/lib/utils/cn'

export function Itinerary() {
  const { tripId } = useParams()
  const { trip } = useTripParams()
  const view = useItineraryStore((s) => s.view)
  const load = useItineraryStore((s) => s.load)
  const remove = useItineraryStore((s) => s.remove)
  const move = useItineraryStore((s) => s.move)
  const ideas = useIdeasStore((s) => s.ideas)
  const loadIdeas = useIdeasStore((s) => s.loadIdeas)
  const categories = useTripsStore((s) => s.categories)
  const members = useTripsStore((s) => (tripId ? s.membersByTrip[tripId] : undefined))
  const plans = useTripsStore((s) => (tripId ? s.memberPlansByTrip[tripId] : undefined))
  const loadMembers = useTripsStore((s) => s.loadMembers)
  const loadPlans = useTripsStore((s) => s.loadMemberPlans)
  const currentUser = useAuthStore((s) => s.currentUser)

  const [selectedId, setSelectedId] = useState<string>('all')

  useEffect(() => {
    if (tripId) {
      void load(tripId)
      void loadIdeas(tripId)
      void loadMembers(tripId).catch(() => {})
      void loadPlans(tripId).catch(() => {})
    }
  }, [tripId, load, loadIdeas, loadMembers, loadPlans])

  useEffect(() => {
    if (!plans?.length) return
    // oxlint-disable-next-line react/set-state-in-effect -- preseleccionar el integrante actual cuando cargan los planes
    setSelectedId((prev) =>
      prev === 'all' && currentUser ? (plans.some((p) => p.user_id === currentUser.id) ? currentUser.id : 'all') : prev,
    )
  }, [plans, currentUser])

  const planById = useMemo(() => new Map((plans ?? []).map((p) => [p.user_id, p])), [plans])

  const selectedPlan = selectedId === 'all' ? null : planById.get(selectedId) ?? null
  const presentDays = useMemo(() => {
    if (trip && selectedPlan) {
      const days = memberPresentDayNumbers(selectedPlan, trip)
      if (days.length) return new Set(days)
    }
    return null
  }, [trip, selectedPlan])

  const visibleDays = useMemo(
    () => (presentDays ? view.days.filter((d) => presentDays.has(d.day_number)) : view.days),
    [view.days, presentDays],
  )

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

  const selectedDaysCount =
    selectedPlan && trip ? memberPresentDays(selectedPlan, trip) : null
  const totalDays = trip?.start_date && trip?.end_date ? visibleDays.length || 0 : 0

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-2xl font-extrabold text-ink">🗓️ Itinerario del viaje</h2>
        <p className="mt-0.5 text-sm font-medium text-ink-soft">
          Cada uno ve los días del viaje que le tocan. Chusmeá el de los demás ⬇️
        </p>

        <div role="group" aria-label="Ver itinerario por integrante" className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          <button
            type="button"
            aria-pressed={selectedId === 'all'}
            onClick={() => setSelectedId('all')}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 font-display text-sm font-bold transition',
              'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
              selectedId === 'all'
                ? 'border-transparent bg-ink text-white shadow-md'
                : 'border-ink/10 bg-white text-ink-soft hover:border-ink/30',
            )}
          >
            👀 Todos
          </button>
          {(members ?? []).map((m) => {
            const plan = planById.get(m.id)
            const days = trip && plan ? memberPresentDays(plan, trip) : null
            const active = selectedId === m.id
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 font-display text-sm font-bold transition',
                  'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
                  active
                    ? 'border-transparent text-white shadow-md'
                    : 'border-ink/10 bg-white text-ink-soft hover:border-ink/30',
                )}
                style={active ? { backgroundColor: m.color } : undefined}
              >
                <span aria-hidden>{m.emoji}</span>
                {m.name}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-extrabold',
                    active ? 'bg-white/25 text-white' : 'bg-ink/5 text-ink-soft',
                  )}
                >
                  {days != null ? `${days}d` : 'sin fechas'}
                </span>
              </button>
            )
          })}
        </div>

        {selectedPlan && trip && (
          <div className="mt-2 rounded-2xl bg-ink/5 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">
              {selectedPlan.user_id === currentUser?.id
                ? '🔵 Este es tu itinerario'
                : '👀 Estás viendo el itinerario de este integrante'}
              {selectedDaysCount != null &&
                ` · ${selectedDaysCount} ${selectedDaysCount === 1 ? 'día' : 'días'} de viaje`}
            </p>
            {selectedPlan.arrival_date && formatMemberRange(selectedPlan.arrival_date, selectedPlan.departure_date) !== '' && (
              <p className="text-xs font-medium text-ink-soft">
                {formatMemberRange(selectedPlan.arrival_date, selectedPlan.departure_date)}
              </p>
            )}
          </div>
        )}
      </div>

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
                    .then(() => {
                      fireMiniConfetti()
                      toastSuccess(`"${idea.title}" al día ${day} 📅`)
                    })
                    .catch((e: unknown) =>
                      toastError(e instanceof Error ? e.message : 'No se pudo agregar'),
                    )
                }}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 font-display text-sm font-bold text-ink shadow-card transition-transform active:scale-95"
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
      ) : visibleDays.length === 0 ? (
        <EmptyState
          emoji="🌴"
          title="No está de viaje esos días"
          cta="Este integrante no tiene planes en los días que pasa en Brasil, o no definió sus fechas todavía."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {visibleDays.map((day) => (
            <section key={day.day_number}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink font-display text-lg font-extrabold text-white shadow-card">
                  {day.day_number}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-extrabold text-ink">Día {day.day_number}</h3>
                  {trip && (
                    <p className="-mt-0.5 text-xs font-medium text-ink-soft">{dayLabel(trip, day.day_number)}</p>
                  )}
                </div>
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

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <div className="flex gap-1">
                          <button
                          onClick={() => void swapWithinDay(item, -1)}
                          aria-label="Subir"
                          className="grid h-10 w-10 place-items-center rounded-lg bg-ink/5 text-sm text-ink-soft hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => void swapWithinDay(item, 1)}
                          aria-label="Bajar"
                          className="grid h-10 w-10 place-items-center rounded-lg bg-ink/5 text-sm text-ink-soft hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => void remove(item.id).catch(() => {})}
                          aria-label="Sacar del itinerario"
                          className="grid h-10 w-10 place-items-center rounded-lg bg-danger/10 text-sm text-danger hover:bg-danger/20 focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:outline-none"
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
                        className="cursor-pointer rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm font-bold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-coral/70 focus:border-coral"
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
              size="md"
              className="mt-2"
              onClick={() => {
                if (confirmedOutside.length) {
                  const idea = confirmedOutside[0]
                  if (!tripId) return
                  useItineraryStore
                    .getState()
                    .add(tripId, idea.id, view.days.length + 1)
                    .then(() => fireMiniConfetti())
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
            <p className="mt-2 text-xs text-ink-soft">
              {confirmedOutside.length
                ? `${confirmedOutside.length} confirmadas esperando agendarse`
                : 'Confirmá ideas desde la pestaña de Ideas para agendar.'}
            </p>
          </div>
        </div>
      )}

      {totalDays > 0 && visibleDays.length > 0 && (
        <p className="sr-only">Mostrando {visibleDays.length} días de itinerario</p>
      )}
    </div>
  )
}