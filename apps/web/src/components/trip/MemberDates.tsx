import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/forms'
import { useAuthStore } from '@/lib/state/auth'
import { useTripsStore } from '@/lib/state/trips'
import { cn } from '@/lib/utils/cn'
import { formatShortDate } from '@/lib/utils/format'
import type { MemberTravelDates } from '@/lib/data/types'

export function MemberDates({ tripId }: { tripId: string }) {
  const members = useTripsStore((s) => s.membersByTrip[tripId] ?? [])
  const dates = useTripsStore((s) => s.memberDatesByTrip[tripId])
  const currentUser = useAuthStore((s) => s.currentUser)
  const loadMemberDates = useTripsStore((s) => s.loadMemberDates)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    void loadMemberDates(tripId).catch(() => {})
  }, [tripId, loadMemberDates])

  const byId = useMemo(() => new Map((dates ?? []).map((d) => [d.user_id, d])), [dates])

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-extrabold text-ink">🗓️ ¿Quién va cuándo?</h3>
        <span className="text-2xl" aria-hidden>
          ✈️
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Cada uno define sus fechas; no hace falta que todos coincidan con el rango del viaje.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {members.map((m) => {
          const d = byId.get(m.id)
          const isMe = m.id === currentUser?.id
          const labeled = d && (d.arrival_date || d.departure_date)
          return (
            <li
              key={m.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl border-2 bg-ink/4 px-3.5 py-2.5',
                isMe ? 'border-coral/40 bg-coral/8' : 'border-transparent',
              )}
            >
              <Avatar user={m} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">
                  {m.name}
                  {isMe && (
                    <span className="ml-2 rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-coral">
                      Vos
                    </span>
                  )}
                </p>
                <p className="text-xs font-medium text-ink-soft">
                  {labeled ? (
                    <>
                      {d?.arrival_date ? formatShortDate(d.arrival_date) : '…'}{' '}
                      <span className="text-ink/40">→</span>{' '}
                      {d?.departure_date ? formatShortDate(d.departure_date) : '…'}
                    </>
                  ) : (
                    'Sin definir'
                  )}
                </p>
              </div>
              {isMe && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {editing && currentUser && (
        <MemberDatesEditor
          tripId={tripId}
          initial={byId.get(currentUser.id) ?? null}
          onClose={() => setEditing(false)}
        />
      )}
    </Card>
  )
}

interface EditorProps {
  tripId: string
  initial: MemberTravelDates | null
  onClose: () => void
}

function MemberDatesEditor({ tripId, initial, onClose }: EditorProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const saveMemberDates = useTripsStore((s) => s.saveMemberDates)
  const [arrival, setArrival] = useState(initial?.arrival_date ?? '')
  const [departure, setDeparture] = useState(initial?.departure_date ?? '')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async () => {
    const a = arrival || null
    const d = departure || null
    if (a && d && a > d) {
      setFormError('La salida no puede ser antes que la llegada.')
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      if (currentUser) await saveMemberDates(tripId, currentUser.id, { arrival_date: a, departure_date: d })
      onClose()
    } catch {
      setFormError('No se pudieron guardar las fechas. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Tus fechas de viaje"
      emoji="🗓️"
      ariaLabel="Editar tus fechas de viaje"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} loading={saving}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Contá cuándo llegás y cuándo te vas. Podés dejar uno vacío si todavía no lo sabés.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Llegada"
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
          />
          <Input
            label="Salida"
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </div>
        {formError && (
          <p className="rounded-2xl bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        )}
      </div>
    </Modal>
  )
}