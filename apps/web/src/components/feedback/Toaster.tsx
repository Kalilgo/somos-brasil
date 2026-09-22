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
      className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-white shadow-card-lg ${styles[type]}`}
    >
      {emoji && <span aria-hidden className="text-xl">{emoji}</span>}
      <p className="flex-1 font-display text-sm font-semibold">{message}</p>
      <button
        onClick={() => dismiss(id)}
        aria-label="Cerrar aviso"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/15 hover:text-white"
      >
        ✕
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}