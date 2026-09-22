import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useIdeasStore } from '@/lib/state/ideas'
import { useItineraryStore } from '@/lib/state/itinerary'
import { useTripParams } from '@/hooks/useTripParams'
import { formatPrice } from '@/lib/utils/format'

export function TripDashboard() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const ideas = useIdeasStore((s) => s.ideas)
  const loadingIdeas = useIdeasStore((s) => s.loading)
  const loadIdeas = useIdeasStore((s) => s.loadIdeas)
  const view = useItineraryStore((s) => s.view)
  const loadItinerary = useItineraryStore((s) => s.load)
  const { trip } = useTripParams()

  useEffect(() => {
    if (tripId) {
      void loadIdeas(tripId)
      void loadItinerary(tripId)
    }
  }, [tripId, loadIdeas, loadItinerary])

  if (loadingIdeas) return <LoadingState />

  const totalVotes = ideas.reduce(
    (acc, i) => acc + Object.values(i.vote_counts).reduce((a, b) => a + b, 0),
    0,
  )
  const confirmed = ideas.filter((i) => i.status === 'confirmed').length
  const inDiscussion = ideas.filter((i) => i.status === 'discussing').length
  const estCost = ideas
    .filter((i) => i.status === 'confirmed' && i.price != null && i.currency === (trip?.currency ?? 'USD'))
    .reduce((acc, i) => acc + (i.price ?? 0), 0)
  const recent = [...ideas]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)

  const stats = [
    { label: 'Ideas', emoji: '💡', value: ideas.length, color: '#2E86DE' },
    { label: 'Confirmadas', emoji: '✅', value: confirmed, color: '#00A878' },
    { label: 'En discusión', emoji: '🗣️', value: inDiscussion, color: '#FF9F1C' },
    { label: 'Votos', emoji: '🗳️', value: totalVotes, color: '#FF5A5F' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="flex items-center gap-3 p-4">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
                style={{ backgroundColor: `${s.color}22` }}
                aria-hidden
              >
                {s.emoji}
              </span>
              <div>
                <p className="font-display text-2xl font-extrabold leading-none text-ink">{s.value}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{s.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-ink">🎯 Próximos pasos</h3>
            <span className="text-2xl" aria-hidden>🛫</span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            <Step
              emoji="💡"
              text="Proponé o votá ideas en las categorías que faltan"
              onClick={() => navigate(`/viajes/${tripId}/ideias`)}
            />
            <Step
              emoji="🗓️"
              text="Armá el itinerario día por día con las confirmadas"
              onClick={() => navigate(`/viajes/${tripId}/itinerario`)}
            />
            <Step
              emoji="💰"
              text="Chusmeá el resumen de costos por persona"
              onClick={() => navigate(`/viajes/${tripId}/resumo`)}
            />
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg font-extrabold text-ink">
            Últimas movidas del grupo
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {recent.length === 0 ? (
              <p className="text-sm font-medium text-ink-soft">
                Nada todavía. ¡La primera idea puede ser tuya!
              </p>
            ) : (
              recent.map((idea) => (
                <li key={idea.id} className="flex items-center gap-2.5">
                  <Avatar user={idea.proposer} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {idea.proposer?.name} propuso “{idea.title}”
                  </span>
                  <span className="shrink-0 font-display text-xs font-bold text-verde-dark">
                    {formatPrice(idea.price, idea.currency) || 'A definir'}
                  </span>
                </li>
              ))
            )}
            {view.days.length > 0 && (
              <li className="mt-1 rounded-xl bg-verde/10 px-3 py-2 text-sm font-semibold text-verde-dark">
                📅 {view.days.length} {view.days.length === 1 ? 'día armado' : 'días armados'} en el itinerario
              </li>
            )}
          </ul>
        </Card>
      </div>

      {estCost > 0 && (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-2 border-verde/30 bg-verde/8 p-5">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-verde-dark">
              Costo estimado confirmado
            </p>
            <p className="font-display text-3xl font-extrabold text-ink">
              {formatPrice(estCost, trip?.currency ?? 'USD')}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate(`/viajes/${tripId}/resumo`)}>
            Ver detalle →
          </Button>
        </Card>
      )}
    </div>
  )
}

function Step({ emoji, text, onClick }: { emoji: string; text: string; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-transparent bg-ink/4 px-3.5 py-3 text-left font-semibold text-ink transition-all hover:border-coral/40 hover:bg-ink/8 active:scale-[0.99]"
      >
        <span className="text-xl" aria-hidden>{emoji}</span>
        <span className="flex-1 text-sm">{text}</span>
        <span className="text-coral">→</span>
      </button>
    </li>
  )
}