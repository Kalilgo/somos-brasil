import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import type { TripSummary as Summary } from '@/types/db'
import { repo } from '@/lib/data'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card } from '@/components/ui/Card'
import { toastSuccess } from '@/lib/state/toasts'
import { useCountUp } from '@/hooks/useCountUp'

function Money({ value, currency }: { value: number; currency: string }) {
  const animated = useCountUp(value)
  const text = new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Math.round(animated),
  )
  return <>{text}</>
}

export function TripSummary() {
  const { tripId } = useParams()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    if (!tripId) return
    repo()
      .getTripSummary(tripId)
      .then((s) => alive && setSummary(s))
      .catch(() => alive && setSummary(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tripId])

  const copySummary = useCallback(() => {
    if (!summary) return
    const lines = [
      `💰 RESUMEN — viaje confirmado · ${summary.confirmed_count} ideas`,
      '',
      ...summary.totals_per_category.map(
        (c) => `${c.emoji} ${c.name}: ${c.total == null ? 'a definir' : `${c.total} ${summary.trip_currency}`} (${c.count})`,
      ),
      '',
      ...summary.totals_per_currency.map((t) => `Total ${t.currency}: ${t.total}`),
      ...summary.per_person.map(
        (p) => `→ Por persona: ~${p.per_member == null ? 'a definir' : p.per_member.toFixed(0)} ${p.currency}`,
      ),
      '',
      'Hecho con ❤️ en Somos Brasil',
    ]
    void navigator.clipboard?.writeText(lines.join('\n')).then(() =>
      toastSuccess('Resumen copiado, mandalo al grupo 📋', '📤'),
    )
  }, [summary])

  if (loading) return <LoadingState />

  if (!summary) {
    return (
      <EmptyState
        emoji="🧮"
        title="No pudimos calcular el resumen"
        cta="Confirmá algunas ideas y volvé a intentar."
      />
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold text-ink">💰 Resumen del viaje</h2>
        <button
          type="button"
          onClick={copySummary}
          className="min-h-11 rounded-full bg-ink px-4 py-2 font-display text-sm font-bold text-white transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream focus-visible:outline-none"
        >
          📋 Copiar para el grupo
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.per_person.map((p) => (
          <Card key={p.currency} className="border-2 border-verde/30 bg-verde/8 p-5">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-verde-dark">
              ~ Por persona ({p.currency})
            </p>
            <p className="mt-1 font-display text-4xl font-extrabold text-ink">
              {p.per_member == null ? '—' : <Money value={p.per_member} currency={p.currency} />}
            </p>
            <p className="mt-1 text-xs font-medium text-ink-soft">
              Entre {summary.member_count} integrantes, sin gastos "a definir"
            </p>
          </Card>
        ))}
        {summary.per_person.length === 0 && (
          <Card className="p-5">
            <p className="font-display text-4xl font-extrabold text-ink">$ 0 / 0</p>
            <p className="mt-1 text-xs font-medium text-ink-soft">
              Todavía no hay ideas confirmadas con precio.
            </p>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <h3 className="mb-3 font-display text-xl font-extrabold text-ink">
          Totales por categoría ({summary.confirmed_count} confirmadas)
        </h3>
        {summary.totals_per_category.length === 0 ? (
          <EmptyState
            emoji="🕵️"
            title="Sin confirmadas con precio"
            cta="Confirmá ideas para que aparezcan los totales por categoría."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.totals_per_category.map((c) => (
              <Card key={c.category_id} className="flex items-center gap-4 p-4">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `${c.color}22` }}
                  aria-hidden
                >
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-ink">{c.name}</p>
                  <p className="text-xs font-medium text-ink-soft">
                    {c.count} {c.count === 1 ? 'idea' : 'ideas'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-extrabold text-ink">
                    {c.total == null ? '—' : <Money value={c.total} currency={summary.trip_currency} />}
                  </p>
                  <p className="text-xs font-medium text-ink-soft">{summary.trip_currency}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}