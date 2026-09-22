import { useEffect, useState } from 'react'
import { UPDATE_DISMISS_KEY, initVersionCheck, useVersionStore } from '@/lib/version'

export function UpdateBanner() {
  const updateAvailable = useVersionStore((s) => s.updateAvailable)
  const markShown = useVersionStore((s) => s.markShown)
  const [dismissed, setDismissed] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(UPDATE_DISMISS_KEY) === '1',
  )

  useEffect(() => {
    if (!import.meta.env.PROD) return

    const stop = initVersionCheck()
    return stop
  }, [])

  if (!updateAvailable || dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(UPDATE_DISMISS_KEY, '1')
    setDismissed(true)
    markShown()
  }

  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 print:hidden">
      <div className="flex max-w-sm items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-white shadow-card-lg">
        <span className="text-sm font-bold">✨ Hay una versión nueva</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-9 rounded-full bg-coral px-4 font-display text-sm font-extrabold text-white transition-transform active:scale-95"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar aviso de actualización"
          className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}