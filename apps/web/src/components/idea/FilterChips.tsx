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
        'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-sm font-bold transition',
        'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
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

  const statusOptions = [
    { value: 'all', label: '✨ Todos los estados' },
    ...(Object.keys(IDEA_STATUSES) as (keyof typeof IDEA_STATUSES)[]).map((st) => ({
      value: st,
      label: `${IDEA_STATUSES[st].emoji} ${IDEA_STATUSES[st].label}`,
    })),
  ]

  const selectClasses =
    'w-full cursor-pointer rounded-full border-2 border-ink/10 bg-white px-3 py-2 font-display text-sm font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-coral/70 focus:border-coral'

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5"
        >
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
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cream to-transparent"
        />
      </div>

      {/* Mobile: dos selectores compactos en una sola fila, sin tanta fila de chips */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <select
          name="filters-status"
          aria-label="Filtrar por estado"
          value={filters.status}
          onChange={(e) => setFilter({ status: e.target.value })}
          className={selectClasses}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          name="filters-sort"
          aria-label="Ordenar ideas"
          value={filters.sort}
          onChange={(e) => setFilter({ sort: e.target.value as SortKey })}
          className={selectClasses}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: chips de estado + orden */}
      <div
        className="hidden flex-wrap items-center justify-between gap-2.5 sm:flex"
        role="group"
        aria-label="Filtrar por estado y orden"
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
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
            name="sort"
            value={filters.sort}
            onChange={(e) => setFilter({ sort: e.target.value as SortKey })}
            className="cursor-pointer rounded-full border-2 border-ink/10 bg-white px-3 py-2 font-display text-base font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-coral/70 focus:border-coral"
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