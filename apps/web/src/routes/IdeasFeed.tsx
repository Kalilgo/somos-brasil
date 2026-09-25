import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { IdeaCard } from '@/components/idea/IdeaCard'
import { IdeaForm } from '@/components/idea/IdeaForm'
import { FilterChips } from '@/components/idea/FilterChips'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useIdeasStore } from '@/lib/state/ideas'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useTripsStore } from '@/lib/state/trips'
import { pluralize } from '@/lib/utils/format'

export function IdeasFeed() {
  const { tripId } = useParams()
  const ideas = useIdeasStore((s) => s.ideas)
  const loading = useIdeasStore((s) => s.loading)
  const filters = useIdeasStore((s) => s.filters)
  const loadIdeas = useIdeasStore((s) => s.loadIdeas)
  const categories = useTripsStore((s) => s.categories)
  const members = useTripsStore((s) => (tripId ? s.membersByTrip[tripId] : undefined))
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (tripId) void loadIdeas(tripId)
  }, [tripId, loadIdeas])

  useAutoRefresh(() => {
    if (tripId) void loadIdeas(tripId)
  }, Boolean(tripId))

  const filtered = useMemo(() => {
    let list = ideas.filter((i) => i.status !== 'discarded')
    if (filters.category !== 'all') list = list.filter((i) => i.category_id === filters.category)
    if (filters.status !== 'all' && filters.status !== 'discarded') list = list.filter((i) => i.status === filters.status)
    if (filters.status === 'discarded') list = ideas.filter((i) => i.status === 'discarded')

    const votes = (i: (typeof list)[number]) => {
      const v = i.vote_counts ?? {}
      return (v['🔥'] ?? 0) + (v['❤️'] ?? 0) + (v['😐'] ?? 0) + (v['🙅'] ?? 0)
    }

    switch (filters.sort) {
      case 'votes':
        return [...list].sort((a, b) => votes(b) - votes(a))
      case 'price_asc':
        return [...list].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
      case 'price_desc':
        return [...list].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity))
      default:
        return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
  }, [ideas, filters])

  const activeCategory = categories.find((c) => c.id === filters.category)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink">
            {activeCategory ? `${activeCategory.emoji} ${activeCategory.name}` : '💡 Ideas'}
          </h2>
          <p className="text-sm font-medium text-ink-soft">
            {pluralize(filtered.length, 'idea', 'ideas')}
            {filters.status !== 'all' && ' · estado filtrado'}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shadow-pop">
          + Nueva idea
        </Button>
      </div>

      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 -mx-4 bg-cream/90 px-4 pb-2 pt-1 backdrop-blur-md sm:static sm:z-auto sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none">
        <FilterChips />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🦜"
          title={filters.status === 'discarded' ? 'Nada descartado por acá' : 'Todavía no hay nada por acá'}
          cta={
            filters.status === 'discarded'
              ? 'Las ideas descartadas quedan archivadas en este historial.'
              : 'Proponé la primera idea y arranquemos a armar el viaje.'
          }
          actionLabel="+ Proponer idea"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} members={members} />
          ))}
        </div>
      )}

      {tripId && (
        <IdeaForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          tripId={tripId}
          defaultCategory={activeCategory?.id ?? filters.category}
        />
      )}
    </div>
  )
}