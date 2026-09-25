import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { IDEA_STATUSES } from '@/lib/utils/constants'

export type SortKey = 'recent' | 'price_asc' | 'price_desc' | 'votes'

export interface IdeaFilters {
  category: string
  status: string
  sort: SortKey
}

const SORTS: SortKey[] = ['recent', 'votes', 'price_asc', 'price_desc']
const STATUSES = Object.keys(IDEA_STATUSES)

const CATEGORY_KEY = 'categoria'
const STATUS_KEY = 'estado'
const SORT_KEY = 'orden'

function read(p: URLSearchParams): IdeaFilters {
  const sort = p.get(SORT_KEY)
  const status = p.get(STATUS_KEY)
  return {
    category: p.get(CATEGORY_KEY) ?? 'all',
    status: status && STATUSES.includes(status) ? status : 'all',
    sort: SORTS.includes(sort as SortKey) ? (sort as SortKey) : 'recent',
  }
}

function write(p: URLSearchParams, filters: IdeaFilters): URLSearchParams {
  const set = (key: string, value: string, fallback: string) => {
    if (value === fallback) p.delete(key)
    else p.set(key, value)
  }
  set(CATEGORY_KEY, filters.category, 'all')
  set(STATUS_KEY, filters.status, 'all')
  set(SORT_KEY, filters.sort, 'recent')
  return p
}

/**
 * Los filtros viven en la URL: se pueden compartir ("mirá las ideas de
 * comida"), sobreviven al back/forward y no se pierden al cambiar de pestaña.
 */
export function useIdeaFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => read(params), [params])

  const setFilter = useCallback(
    (patch: Partial<IdeaFilters>) => {
      setParams((prev) => write(new URLSearchParams(prev), { ...read(prev), ...patch }), {
        replace: true,
      })
    },
    [setParams],
  )

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  const isFiltered = filters.category !== 'all' || filters.status !== 'all' || filters.sort !== 'recent'

  return { filters, setFilter, reset, isFiltered }
}
