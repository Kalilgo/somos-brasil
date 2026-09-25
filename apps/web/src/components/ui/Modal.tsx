import { useEffect, useRef, useEffectEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  emoji?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
}

const sizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
}

export function Modal({ open, onClose, title, emoji, children, footer, size = 'md', ariaLabel }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseEvent = useEffectEvent(onClose)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseEvent()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevFocus = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? title}
            tabIndex={-1}
            className={cn(
              'relative flex w-full flex-col rounded-t-[28px] bg-white shadow-card-lg outline-none',
              'sm:rounded-[28px] max-h-[92dvh]',
              sizes[size],
            )}
            initial={{ y: 60, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="flex items-center gap-3 px-5 pt-4 pb-2">
              {emoji && <span className="text-2xl">{emoji}</span>}
              {title && (
                <h2 className="flex-1 font-display text-xl font-bold text-ink">{title}</h2>
              )}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-lg text-ink-soft transition-colors hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 py-3 pb-[env(safe-area-inset-bottom)]">{children}</div>
            {footer && (
              <div className="border-t border-ink/5 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}