import { useIdeasStore, type SortKey } from '@/lib/state/ideas'
import { useTripsStore } from '@/lib/state/trips'
import { IDEA_STATUSES } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recientes' },
  { value: 'votes', label: 'Más votadas' },
  { value: 'price_asc', label: 'Precio ↑' },
  { value: 'price_desc', label: 'Precio ↓' },
]

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-display text-sm font-bold transition-all',
        active ? 'text-white shadow-md' : 'bg-white text-ink-soft hover:text-ink border-2 border-ink/10',
      )}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  )
}

export function FilterChips() {
  const filters = useIdeasStore((s) => s.filters)
  const setFilter = useIdeasStore((s) => s.setFilter)
  const categories = useTripsStore((s) => s.categories)

  return (
    <div className="flex flex-col gap-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
        <Chip active={filters.category === 'all'} onClick={() => setFilter({ category: 'all' })} color="#33201a">
          🧺 Todo
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={filters.category === c.id || filters.category === c.slug}
            onClick={() => setFilter({ category: c.id })}
            color={c.color}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.status === 'all'} onClick={() => setFilter({ status: 'all' })}>
            Todos los estados
          </Chip>
          {(Object.keys(IDEA_STATUSES) as (keyof typeof IDEA_STATUSES)[]).map((st) => {
            const info = IDEA_STATUSES[st]
            return (
              <Chip
                key={st}
                active={filters.status === st}
                onClick={() => setFilter({ status: st })}
              >
                <span aria-hidden>{info.emoji}</span>
                {info.label}
              </Chip>
            )
          })}
        </div>

        <label className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink-soft">
          Orden
          <select
            value={filters.sort}
            onChange={(e) => setFilter({ sort: e.target.value as SortKey })}
            className="cursor-pointer rounded-full border-2 border-ink/10 bg-white px-3 py-1.5 font-display text-sm font-bold text-ink outline-none focus:border-coral"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}