import { useEffect, useReducer } from 'react'
import { timeAgo } from '@/lib/utils/format'

interface SyncBadgeProps {
  loadedAt: number
  onRefresh: () => void
  busy?: boolean
}

/**
 * Le dice a la persona cuándo se leyeron los datos por última vez y le da un
 * botón para traer lo nuevo del grupo. Sin esto, la app parece congelada.
 */
export function SyncBadge({ loadedAt, onRefresh, busy = false }: SyncBadgeProps) {
  const [, tick] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  const ago = loadedAt ? timeAgo(new Date(loadedAt).toISOString()) : null

  return (
    <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-ink-soft">
      <span aria-live="polite">
        {!ago ? 'Sin datos todavía' : ago === 'recién' ? 'Datos recién cargados' : `Datos de ${ago}`}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy}
        aria-label="Traer los datos nuevos del grupo"
        className="grid h-9 min-w-9 place-items-center rounded-full px-2 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
      >
        {busy ? (
          <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
        ) : (
          <span aria-hidden>↻</span>
        )}
      </button>
    </div>
  )
}
