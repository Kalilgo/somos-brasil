import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useToastStore, type ToastType } from '@/lib/state/toasts'

const styles: Record<ToastType, string> = {
  success: 'bg-verde',
  error: 'bg-danger',
  info: 'bg-ink',
}

function ToastCard({ id, message, emoji, type }: { id: string; message: string; emoji?: string; type: ToastType }) {
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 4200)
    return () => clearTimeout(t)
  }, [id, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', damping: 24, stiffness: 380 }}
      className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-white shadow-card-lg ${styles[type]}`}
    >
      {emoji && <span aria-hidden className="text-xl">{emoji}</span>}
      <p className="flex-1 font-display text-sm font-semibold">{message}</p>
      <button
        onClick={() => dismiss(id)}
        aria-label="Cerrar aviso"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
      >
        ✕
      </button>
    </motion.div>
  )
}

const MAX_VISIBLE = 3

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const hasError = toasts.some((t) => t.type === 'error')

  return createPortal(
    <div
      role={hasError ? 'alert' : 'status'}
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:items-end sm:pb-4"
    >
      <AnimatePresence>
        {toasts.slice(-MAX_VISIBLE).map((t) => (
          <ToastCard key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}