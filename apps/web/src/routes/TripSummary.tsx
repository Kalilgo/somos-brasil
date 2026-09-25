import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import type { TripSummary as Summary } from '@/types/db'
import { repo } from '@/lib/data'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { useCountUp } from '@/hooks/useCountUp'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { formatMemberRange } from '@/lib/utils/tripDates'
import { cn } from '@/lib/utils/cn'

function Money({ value, currency }: { value: number; currency: string }) {
  const animated = useCountUp(value)
  const text = new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Math.round(animated),
  )
  return <>{text}</>
}

function fmtTotal(value: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Math.round(value),
  )
}

export function TripSummary() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    if (!tripId) return
    // oxlint-disable-next-line react/set-state-in-effect -- mostrar el loader al cambiar de viaje o al reintentar
    setLoading(true)
    repo()
      .getTripSummary(tripId)
      .then((s) => alive && setSummary(s))
      .catch(() => alive && setSummary(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tripId, attempt])

  useAutoRefresh(() => {
    if (tripId) void repo().getTripSummary(tripId).then(setSummary).catch(() => {})
  }, Boolean(tripId))

  const retry = () => {
    setLoading(true)
    setAttempt((n) => n + 1)
  }

  const copySummary = useCallback(() => {
    if (!summary) return
    const hasShares = summary.payer_total_days > 0
    const lines = [
      `💰 RESUMEN — viaje confirmado · ${summary.confirmed_count} ideas`,
      '',
      ...summary.members.map((m) => {
        const days = m.days_present == null ? 'sin fechas' : `${m.days_present} días`
        const shares = hasShares && summary.per_person.length
          ? summary.per_person
              .map((p) =>
                p.per_day != null && m.days_present != null
                  ? fmtTotal(p.per_day * m.days_present, p.currency)
                  : 'a definir',
              )
              .join(' · ')
          : 'aún sin gastos'
        return `${m.emoji} ${m.name} (${days}): ~${shares}`
      }),
      ...(hasShares
        ? [`Reparto proporcional a ${summary.payer_total_days} días totales entre quienes definieron fechas.`]
        : ['Todavía no hay reparto: cada uno tiene que definir sus fechas de viaje.']),
      '',
      ...summary.totals_per_category.map(
        (c) => `${c.emoji} ${c.name}: ${c.total == null ? 'a definir' : `${fmtTotal(c.total, summary.trip_currency)} (${c.count})`}`,
      ),
      '',
      'Hecho con ❤️ en Somos Brasil',
    ]
    void navigator.clipboard
      ?.writeText(lines.join('\n'))
      .then(() => toastSuccess('Resumen copiado, mandalo al grupo 📋', '📤'))
      .catch(() => toastError('El navegador no dejó copiar. Probá seleccionar el texto a mano.'))
  }, [summary])

  if (loading) return <LoadingState />

  if (!summary) {
    return (
      <EmptyState
        as="h2"
        emoji="🧮"
        title="No pudimos calcular el resumen"
        cta="Puede ser un problema de conexión. Reintentá o confirmá algunas ideas con precio."
        actionLabel="Reintentar"
        onAction={retry}
      />
    )
  }

  const hasShares = summary.payer_total_days > 0

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

      <Card className="border-2 border-verde/30 bg-verde/8 p-5">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-verde-dark">
          💸 Parte de cada uno
        </p>
        <p className="mt-1 text-sm font-medium text-ink-soft">
          El total se reparte proporcional a los días que cada integrante pasa en el viaje. El que
          está más días paga más.
        </p>

        {!hasShares ? (
          <div className="mt-4 rounded-2xl bg-white/70 p-4">
            <p className="text-sm font-semibold text-ink">
              Todavía no hay reparto en curso.
            </p>
            <p className="mt-1 text-sm font-medium text-ink-soft">
              Cada uno tiene que definir sus fechas de llegada y vuelta para que el costo se divida
              por los días. Sin fechas, nadie queda incluido en la cuenta.
            </p>
            {tripId && (
              <button
                onClick={() => navigate(`/viajes/${tripId}`)}
                className="mt-3 rounded-full bg-ink px-4 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
              >
                Definir mis fechas
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {summary.members.map((m) => {
              const shares = summary.per_person.map((p) =>
                p.per_day != null && m.days_present != null && m.days_present > 0
                  ? { currency: p.currency, value: p.per_day * m.days_present }
                  : null,
              )
              return (
                <li
                  key={m.user_id}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card',
                    m.days_present == null && 'opacity-70',
                  )}
                >
                  <Avatar user={{ name: m.name, emoji: m.emoji, color: m.color }} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-ink">{m.name}</p>
                    <p className="text-xs font-medium text-ink-soft">
                      {m.days_present != null ? (
                        <>
                          {m.days_present} {m.days_present === 1 ? 'día' : 'días'}
                          {m.arrival_date && formatMemberRange(m.arrival_date, m.departure_date) !== ''
                            ? ` · ${formatMemberRange(m.arrival_date, m.departure_date)}`
                            : ''}
                        </>
                      ) : (
                        'Sin fechas definidas — no entra en el reparto'
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {m.days_present != null && m.days_present > 0 ? (
                      shares.length ? (
                        shares.filter(Boolean).map((s) =>
                          s ? (
                            <span
                              key={s.currency}
                              className="font-display text-sm font-extrabold text-verde-dark"
                            >
                              ~{fmtTotal(s.value, s.currency)}
                            </span>
                          ) : null,
                        )
                      ) : (
                        <span className="font-display text-sm font-extrabold text-ink/40">
                          sin gastos aún
                        </span>
                      )
                    ) : (
                      <span className="font-display text-xs font-bold text-ink/30">—</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {hasShares && (
          <p className="mt-3 text-xs font-medium text-ink-soft">
            Reparto sobre {summary.payer_total_days} días totales entre quienes definieron fechas.
          </p>
        )}
      </Card>

      <div className="mt-8">
        <h3 className="mb-3 font-display text-xl font-extrabold text-ink">
          Totales por categoría ({summary.confirmed_count} confirmadas)
        </h3>
        {summary.totals_per_category.length === 0 ? (
          <EmptyState
            as="h2"
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