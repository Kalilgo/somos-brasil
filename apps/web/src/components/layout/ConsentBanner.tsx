import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { acceptConsent, hasConsent } from '@/lib/consent'

export function ConsentBanner() {
  const [visible, setVisible] = useState(() => !hasConsent())

  if (!visible) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Aviso de privacidad"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="fixed inset-x-3 bottom-3 z-[55] sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-md"
        >
          <div className="rounded-3xl border border-ink/8 bg-white/95 p-4 shadow-card-lg backdrop-blur-md">
            <p className="font-display text-sm font-extrabold text-ink">🤝 Tu privacidad</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Guardamos tu identidad y preferencias en este dispositivo para que la app
              funcione, y tus datos viajan a nuestro hosting para que el grupo comparta el
              viaje. No usamos cookies de seguimiento ni publicidad.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  acceptConsent()
                  setVisible(false)
                }}
                className="min-h-11 rounded-full bg-coral px-5 font-display text-sm font-extrabold text-white transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
              >
                Entendido
              </button>
              <Link
                to="/privacidad"
                className="flex min-h-11 items-center rounded-full px-4 font-display text-sm font-bold text-ink transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
              >
                Cómo usamos tus datos
              </Link>
              <Link
                to="/cookies"
                className="flex min-h-11 items-center rounded-full px-2 font-display text-sm font-bold text-coral transition-colors hover:bg-coral/5 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
              >
                Cookies
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}