import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, TextArea } from '@/components/ui/forms'
import { MemberPicker } from './MemberPicker'
import { CURRENCIES } from '@/lib/utils/constants'
import { useTripsStore } from '@/lib/state/trips'
import { useAuthStore } from '@/lib/state/auth'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { fireMiniConfetti } from '@/components/feedback/Confetti'
import { repo } from '@/lib/data'
import type { DataRepo as Data } from '@/lib/data/types'
import type { Trip } from '@/types/db'

export function CreateTripModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const createTrip = useTripsStore((s) => s.createTrip)
  const currentUser = useAuthStore((s) => s.currentUser)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [users, setUsers] = useState<Awaited<ReturnType<Data['listUsers']>>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      // oxlint-disable-next-line react/set-state-in-effect -- resetear el form cada vez que se abre el modal
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setCurrency('USD')
      setError('')
      if (currentUser) setMemberIds([currentUser.id])
      repo()
        .listUsers()
        .then((u) => setUsers(u))
        .catch(() => setUsers([]))
    }
  }, [open, currentUser])

  const selectedCount = memberIds.length
  const valid = name.trim().length >= 2 && selectedCount >= 2

  const minEnd = startDate || undefined
  const rangeOk = useMemo(() => {
    if (!startDate || !endDate) return true
    return new Date(startDate) <= new Date(endDate)
  }, [startDate, endDate])

  const submit = async () => {
    if (name.trim().length < 2) {
      setError('El viaje necesita un nombre con onda (mínimo 2 letras).')
      return
    }
    if (selectedCount < 2) {
      setError('Sumá al menos unx amigx más: ¡un viaje no es viaje en solitario! (bueno, casi).')
      return
    }
    if (!rangeOk) {
      setError('El start no puede ser después del end, papá.')
      return
    }
    setSubmitting(true)
    try {
      const trip = await createTrip({
        name: name.trim(),
        description: description.trim() || null,
        currency: currency as Trip['currency'],
        start_date: startDate || null,
        end_date: endDate || null,
        memberIds,
      })
      fireMiniConfetti()
      toastSuccess(`¡${trip.name} creado! Ahora a proponer ideas 💡`)
      onClose()
      navigate(`/viajes/${trip.id}`)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo crear el viaje')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear viaje"
      emoji="🧳"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={submit} loading={submitting} disabled={!valid && !error}>
            Crear viaje 🎉
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nombre"
          placeholder="Brasil 2026: Carnaval"
          value={name}
          maxLength={80}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
        />
        <TextArea
          label="Descripción"
          hint="¿A dónde tiraría? ¿Qué onda grupal? Ojo, acá se puede bardear un poco."
          placeholder="Gran candidato: Recife + Olinda en carnaval..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Fechas (desde)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Hasta" type="date" min={minEnd} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select label="Moneda 💵" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        {!rangeOk && <p className="text-sm font-medium text-danger">Las fechas no cierran: el comienzo va antes del final.</p>}

        <div>
          <span className="mb-1.5 block font-display text-sm font-semibold text-ink">
            ¿Quiénes vienen? ({selectedCount}/6)
          </span>
          <MemberPicker
            users={users}
            selected={memberIds}
            onToggle={(id) =>
              setMemberIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
          />
        </div>

        {error && <p className="font-display text-sm font-semibold text-danger">{error}</p>}
      </div>
    </Modal>
  )
}