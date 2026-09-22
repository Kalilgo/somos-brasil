import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  emoji?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'success' | 'primary'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  emoji = '🤔',
  message,
  confirmLabel = 'Dale, confirmo',
  cancelLabel = 'Me arrepentí, cancelo',
  tone = 'primary',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center py-3 text-center">
        <span className="mb-3 text-5xl" aria-hidden>
          {emoji}
        </span>
        <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
        {message && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{message}</p>}
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row-reverse">
          <Button
            variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}