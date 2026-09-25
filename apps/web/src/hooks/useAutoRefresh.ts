import { useEffect, useEffectEvent } from 'react'

/**
 * Vuelve a pedir datos cuando la app vuelve al primer plano o cuando el
 * dispositivo recupera conexión. Los stores aplican su propio TTL, así que
 * llamar siempre es barato: no hay timers ni polling.
 */
export function useAutoRefresh(load: () => void, enabled = true) {
  const refresh = useEffectEvent(() => {
    load()
  })

  useEffect(() => {
    if (!enabled) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', refresh)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', refresh)
    }
  }, [enabled])
}
