import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, TextArea } from '@/components/ui/forms'
import { CURRENCIES } from '@/lib/utils/constants'
import { useIdeasStore } from '@/lib/state/ideas'
import { useTripsStore } from '@/lib/state/trips'
import { useAuthStore } from '@/lib/state/auth'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { fireCelebration } from '@/components/feedback/Confetti'
import type { Category, Currency } from '@/types/db'
import { cn } from '@/lib/utils/cn'

interface IdeaFormProps {
  open: boolean
  onClose: () => void
  tripId: string
  defaultCategory?: string
}

export interface FieldErrors {
  category?: string
  title?: string
  price?: string
  url?: string
}

function validUrl(value: string): boolean {
  if (!value) return true
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function IdeaForm({ open, onClose, tripId, defaultCategory }: IdeaFormProps) {
  const categories = useTripsStore((s) => s.categories)
  const loadCategories = useTripsStore((s) => s.loadCategories)
  const currentUser = useAuthStore((s) => s.currentUser)
  const addIdea = useIdeasStore((s) => s.addIdea)

  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [link, setLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (!open) return
    if (!categories.length) void loadCategories().catch(() => {})
    // oxlint-disable-next-line react/set-state-in-effect -- resetear el form cada vez que se abre
    setTitle('')
    setDescription('')
    setPrice('')
    setLink('')
    setImageUrl('')
    setErrors({})
    const fallback =
      categories.find((c) => c.slug === defaultCategory || c.id === defaultCategory) ?? categories[0]
    setCategoryId(fallback?.id ?? '')
    setCurrency('USD')
  }, [open, categories, defaultCategory, loadCategories])

  const priceNum = price.trim() === '' ? null : Number(price)
  const priceOk = priceNum === null ? true : Number.isFinite(priceNum) && priceNum >= 0
  const urlOk = validUrl(link) && validUrl(imageUrl)

  const submit = async () => {
    if (!currentUser) return
    const next: FieldErrors = {}
    if (title.trim().length < 3) {
      next.title = 'El título necesita al menos 3 caracteres. ¡Poné onda!'
    }
    if (!categoryId) {
      next.category = 'Elegí una categoría para la idea.'
    }
    if (!priceOk) {
      next.price = 'El precio tiene que ser un número ≥ 0, o dejalo vacío si recién lo averiguás.'
    }
    if (!urlOk) {
      next.url = 'Esos links no son URLs válidas (empezá con http:// o https://).'
    }
    if (next.title || next.category || next.price || next.url) {
      setErrors(next)
      return
    }

    setSubmitting(true)
    try {
      await addIdea({
        trip_id: tripId,
        category_id: categoryId,
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || null,
        link: link.trim() || null,
        image_url: imageUrl.trim() || null,
        price: priceNum,
        currency,
      })
      fireCelebration(3)
      toastSuccess('Idea sumada al grupo 💡', '🎉')
      onClose()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo guardar la idea')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva idea"
      emoji="💡"
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={submit} loading={submitting}>
            Sumar idea 🚀
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 block font-display text-sm font-semibold text-ink">Categoría</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c: Category) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={categoryId === c.id}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-display text-sm font-semibold transition',
                  'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
                  categoryId === c.id
                    ? 'scale-[1.03] border-transparent text-white shadow-md'
                    : 'border-ink/10 bg-white text-ink-soft hover:border-ink/30',
                )}
                style={categoryId === c.id ? { backgroundColor: c.color } : undefined}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
          {errors.category &&
            (categories.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-danger">
                {errors.category} (¿las categorías siguen cargando? Reintentá en un segundo)
              </p>
            ) : (
              <p className="mt-2 text-xs font-semibold text-danger">{errors.category}</p>
            ))}
        </fieldset>

        <Input
          label="Título"
          placeholder="Airbnb en Olinda frente al mar"
          name="idea-title"
          autoComplete="off"
          maxLength={120}
          value={title}
          error={errors.title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((prev) => ({ ...prev, title: undefined }))
          }}
        />
        <TextArea
          label="Descripción"
          hint="Detalles, por qué la propone, para quién sirve…"
          name="idea-description"
          autoComplete="off"
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Precio"
            type="number"
            name="idea-price"
            inputMode="decimal"
            autoComplete="off"
            min={0}
            step="any"
            placeholder="860"
            value={price}
            error={errors.price}
            onChange={(e) => {
              setPrice(e.target.value)
              setErrors((prev) => ({ ...prev, price: undefined }))
            }}
          />
          <Select
            label="Moneda"
            name="currency"
            autoComplete="off"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            label="Link de referencia"
            type="url"
            name="idea-link"
            autoComplete="url"
            placeholder="https://…"
            value={link}
            error={errors.url && link.trim() !== '' ? errors.url : undefined}
            onChange={(e) => {
              setLink(e.target.value)
              setErrors((prev) => ({ ...prev, url: undefined }))
            }}
          />
        </div>

        <Input
          label="Imagen (URL)"
          hint="Opcional: pegá una URL de imagen para darle vida"
          type="url"
          name="idea-image"
          autoComplete="off"
          placeholder="https://…/foto.jpg"
          value={imageUrl}
          error={errors.url && link.trim() === '' ? errors.url : undefined}
          onChange={(e) => {
            setImageUrl(e.target.value)
            setErrors((prev) => ({ ...prev, url: undefined }))
          }}
        />
      </div>
    </Modal>
  )
}