import { useState } from 'react'
import { motion } from 'motion/react'
import type { AppUser, IdeaStatus, IdeaWithRelations, Reaction } from '@/types/db'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ReactionPicker } from './ReactionPicker'
import type { Reactor } from './ReactionPicker'
import { StatusMenu } from './StatusMenu'
import { CommentsSection } from './CommentsSection'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { AddToItineraryModal } from '@/components/itinerary/AddToItineraryModal'
import { fireMiniConfetti } from '@/components/feedback/Confetti'
import { useIdeasStore } from '@/lib/state/ideas'
import { useAuthStore } from '@/lib/state/auth'
import { useTripsStore } from '@/lib/state/trips'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { priceLabel, timeAgo } from '@/lib/utils/format'
import { IDEA_STATUSES, REACTIONS } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'

export function IdeaCard({ idea, members }: { idea: IdeaWithRelations; members?: AppUser[] }) {
  const toggleVote = useIdeasStore((s) => s.toggleVote)
  const changeStatus = useIdeasStore((s) => s.changeStatus)
  const removeIdea = useIdeasStore((s) => s.removeIdea)
  const myUserId = useAuthStore((s) => s.currentUser?.id)
  const tripCreatorId = useTripsStore((s) => s.currentTrip?.created_by)

  // El servidor solo deja borrar la idea a quien la propuso o a quien creó el viaje
  // (member-actions → delete_idea). Si el botón apareciera igual, el grupo vería un
  // botón que siempre responde 403: mejor ni mostrarlo.
  const canDelete = Boolean(myUserId) && (idea.user_id === myUserId || tripCreatorId === myUserId)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<IdeaStatus | null>(null)
  const [pendingNope, setPendingNope] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [addToItineraryOpen, setAddToItineraryOpen] = useState(false)

  const category = idea.category
  const statusInfo = IDEA_STATUSES[idea.status]

  const membersById = new Map((members ?? []).map((u) => [u.id, u]))
  const reactors = (Object.fromEntries(
    REACTIONS.map(({ reaction }) => [
      reaction,
      (idea.votes ?? [])
        .filter((v) => v.reaction === reaction)
        .map((v): Reactor => {
          const u = membersById.get(v.user_id)
          return {
            user_id: v.user_id,
            name: u?.name ?? '???',
            emoji: u?.emoji ?? '👤',
            color: u?.color ?? '#94a3b8',
          }
        }),
    ]),
  ) as Partial<Record<Reaction, Reactor[]>>)

  const handleVote = (reaction: Reaction) => {
    if (reaction === '🙅' && idea.my_vote !== '🙅') {
      setPendingNope(true)
      return
    }
    void toggleVote(idea.id, reaction)
  }

  const handleStatus = async (status: IdeaStatus) => {
    try {
      await changeStatus(idea.id, status)
      if (status === 'confirmed') {
        fireMiniConfetti()
        toastSuccess('¡Idea aprobada por el grupo! ✅', '🤝')
      } else if (status === 'discarded') {
        toastSuccess('Idea descartada. RIP.', '🕊️')
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo cambiar el estado')
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className={cn('flex flex-col gap-3 p-4 sm:p-5', idea.status === 'discarded' && 'opacity-60')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {category && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-xs font-bold"
                  style={{ backgroundColor: `${category.color}22`, color: category.color }}
                >
                  <span aria-hidden>{category.emoji}</span>
                  {category.name}
                </span>
              )}
              <StatusMenu status={idea.status} onSelect={(s) => setConfirmStatus(s)} />
            </div>
            <div className="flex items-center gap-1.5">
              <Avatar user={idea.proposer} size="sm" title={`${idea.proposer?.name} propuso esto`} />
              <span className="hidden text-xs font-medium text-ink-soft sm:inline">
                {timeAgo(idea.created_at)}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-display text-lg font-bold leading-snug text-ink sm:text-xl">
              {idea.title}
            </h3>
            {idea.description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{idea.description}</p>
            )}

            {idea.image_url && (
              <img
                src={idea.image_url}
                alt={`Foto de ${idea.title}`}
                width={400}
                height={225}
                loading="lazy"
                className="mt-3 aspect-video h-auto w-full rounded-2xl object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}

            {(idea.link || idea.price != null) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-verde/15 px-3 py-1.5 font-display text-sm font-bold text-verde-dark">
                  💵 {priceLabel(idea.price, idea.currency)}
                </span>
                {idea.link && (
                  <a
                    href={idea.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-sky/12 px-3 py-1.5 font-display text-sm font-bold text-sky transition-colors hover:bg-sky/25 focus-visible:ring-2 focus-visible:ring-sky/60 focus-visible:outline-none"
                  >
                    🔗 Ver referencia ↗
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-3">
            <ReactionPicker
              counts={idea.vote_counts}
              myVote={idea.my_vote}
              onVote={handleVote}
              myUserId={myUserId}
              reactors={reactors}
            />
            <div className="flex items-center gap-1.5">
              {idea.status === 'confirmed' && !idea.in_itinerary && (
                <button
                  onClick={() => setAddToItineraryOpen(true)}
                  className="rounded-full bg-verde px-3 py-1.5 font-display text-xs font-bold text-white transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-verde/60 focus-visible:outline-none"
                >
                  + Itinerario 🗓️
                </button>
              )}
              <button
                onClick={() => setCommentsOpen((o) => !o)}
                aria-expanded={commentsOpen}
                className={cn(
                  'rounded-full px-3 py-1.5 font-display text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
                  commentsOpen ? 'bg-ink text-white' : 'bg-ink/10 text-ink-soft hover:bg-ink/20',
                )}
              >
                💬 {idea.comments_count > 0 ? idea.comments_count : 'Comentar'}
              </button>
              {canDelete && (
                <button
                  onClick={() => setPendingDelete(true)}
                  aria-label="Eliminar idea"
                  className="rounded-full p-2 text-ink-soft transition-colors hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:outline-none"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {commentsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden border-t border-ink/5 pt-3"
            >
              <CommentsSection ideaId={idea.id} />
            </motion.div>
          )}

          <span className="sr-only">{statusInfo.label}</span>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={Boolean(confirmStatus)}
        onClose={() => setConfirmStatus(null)}
        onConfirm={() => {
          const target = confirmStatus
          setConfirmStatus(null)
          if (target) void handleStatus(target)
        }}
        emoji={confirmStatus === 'discarded' ? '🗑️' : confirmStatus === 'confirmed' ? '✅' : '🤝'}
        title={
          confirmStatus === 'confirmed'
            ? '¿Confirmamos esta idea?'
            : confirmStatus === 'discarded'
              ? '¿Descartar esta idea?'
              : confirmStatus === 'discussing'
                ? '¿Pasar a discusión?'
                : '¿Volver a propuesta?'
        }
        message={
          confirmStatus === 'confirmed'
            ? 'Se marca como confirmada y podés sumarla al itinerario.'
            : confirmStatus === 'discarded'
              ? 'No se borra: queda como descartada para el historial. Se puede revertir.'
              : undefined
        }
        confirmLabel={confirmStatus === 'discarded' ? 'Sí, descartarla' : 'Dale, confirmo'}
        tone={confirmStatus === 'discarded' ? 'danger' : 'primary'}
      />

      <ConfirmDialog
        open={pendingNope}
        onClose={() => setPendingNope(false)}
        onConfirm={() => {
          setPendingNope(false)
          void toggleVote(idea.id, '🙅')
        }}
        emoji="🙅"
        title="¿En serio? 🙅"
        message="El voto 'no' es clima del grupo. Asegurate de que no sea un impulsito."
        confirmLabel="Sí, mi voto es no"
        tone="primary"
      />

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={() => {
          setPendingDelete(false)
          void removeIdea(idea.id).catch((e) =>
            toastError(e instanceof Error ? e.message : 'No se pudo eliminar'),
          )
        }}
        emoji="💥"
        title="¿Borrar esta idea?"
        message="Se elimina de verdad, junto con sus votos y comentarios. No hay vuelta atrás."
        confirmLabel="Sí, borrarla"
        tone="danger"
      />

      <AddToItineraryModal
        open={addToItineraryOpen}
        onClose={() => setAddToItineraryOpen(false)}
        ideaId={idea.id}
      />
    </>
  )
}