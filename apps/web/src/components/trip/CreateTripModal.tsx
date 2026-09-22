import { useEffect, useState } from 'react'
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

interface FieldErrors {
  name?: string
  members?: string
  dates?: string
}

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
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      // oxlint-disable-next-line react/set-state-in-effect -- resetear el form cada vez que se abre el modal
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setCurrency('USD')
      setErrors({})
      if (currentUser) setMemberIds([currentUser.id])
      repo()
        .listUsers()
        .then((u) => setUsers(u))
        .catch(() => setUsers([]))
    }
  }, [open, currentUser])

  const selectedCount = memberIds.length

  const minEnd = startDate || undefined
  const rangeOk =
    !startDate || !endDate ? true : new Date(startDate).getTime() <= new Date(endDate).getTime()

  const submit = async () => {
    const next: FieldErrors = {}
    if (name.trim().length < 2) {
      next.name = 'El viaje necesita un nombre con onda (mínimo 2 letras).'
    }
    if (selectedCount < 2) {
      next.members = 'Sumá al menos unx amigx más: ¡un viaje no es viaje en solitario! (bueno, casi).'
    }
    if (!rangeOk) {
      next.dates = 'Las fechas no cierran: el comienzo va antes del final.'
    }
    if (next.name || next.members || next.dates) {
      setErrors(next)
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
          <Button onClick={submit} loading={submitting}>
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
          name="trip-name"
          autoComplete="off"
          value={name}
          maxLength={80}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((prev) => ({ ...prev, name: undefined }))
          }}
        />
        <TextArea
          label="Descripción"
          hint="¿A dónde tiraría? ¿Qué onda grupal? Ojo, acá se puede bardear un poco."
          placeholder="Gran candidato: Recife + Olinda en carnaval…"
          name="trip-description"
          autoComplete="off"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Fechas (desde)" type="date" name="start-date" autoComplete="off" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Hasta" type="date" min={minEnd} name="end-date" autoComplete="off" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select label="Moneda 💵" name="currency" autoComplete="off" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        {errors.dates && <p className="text-sm font-medium text-danger">{errors.dates}</p>}

        <div>
          <span className="mb-1.5 block font-display text-sm font-semibold text-ink">
            ¿Quiénes vienen? ({selectedCount}/6)
          </span>
          <MemberPicker
            users={users}
            selected={memberIds}
            onToggle={(id) => {
              setErrors((prev) => ({ ...prev, members: undefined }))
              setMemberIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }}
          />
          {errors.members && <p className="mt-1.5 text-sm font-medium text-danger">{errors.members}</p>}
        </div>
      </div>
    </Modal>
  )
}