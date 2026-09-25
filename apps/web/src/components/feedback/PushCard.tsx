import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { disablePush, enablePush, pushState, pushSupported, type PushUiState } from '@/lib/push'

const DISMISS_KEY = 'somos-brasil-push-dismiss'

export function PushCard() {
  const [state, setState] = useState<PushUiState | null>(() => (pushSupported() ? null : 'unsupported'))
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    if (!pushSupported()) return
    void pushState().then(setState)
  }, [])

  if (!state || state === 'unsupported' || dismissed) return null

  const activate = async () => {
    setBusy(true)
    try {
      const next = await enablePush()
      setState(next)
      if (next === 'enabled') toastSuccess('Avisos activados 🔔')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudieron activar los avisos')
    } finally {
      setBusy(false)
    }
  }

  const deactivate = async () => {
    setBusy(true)
    try {
      await disablePush()
      setState('pending')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudieron apagar los avisos')
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <section className="mb-6 flex flex-col gap-3 rounded-3xl border border-coral/20 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-base font-extrabold text-ink">
          {state === 'enabled' ? '🔔 Avisos activados' : state === 'blocked' ? '🔕 Avisos bloqueados' : '🔔 ¿Te aviso cuando el grupo se mueva?'}
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink-soft">
          {state === 'enabled'
            ? 'Todavía no llega nada: el grupo todavía no manda avisos. Cuando empiece, te llegan acá.'
            : state === 'blocked'
              ? 'Bloqueaste las notificaciones en el navegador. Se activan desde los ajustes del sitio.'
              : 'El grupo todavía no manda avisos. Dejalo activado y no te vas a perder nada cuando empiecen.'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {state === 'enabled' ? (
          <Button variant="ghost" onClick={() => void deactivate()} disabled={busy}>
            {busy ? 'Apagando…' : 'Apagar'}
          </Button>
        ) : state === 'pending' ? (
          <>
            <Button onClick={() => void activate()} disabled={busy}>
              {busy ? 'Activando…' : 'Activar avisos 🔔'}
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 rounded-full px-3 font-display text-sm font-bold text-ink-soft transition-colors hover:text-ink"
            >
              Ahora no
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 rounded-full px-3 font-display text-sm font-bold text-ink-soft transition-colors hover:text-ink"
          >
            Cerrar
          </button>
        )}
      </div>
    </section>
  )
}