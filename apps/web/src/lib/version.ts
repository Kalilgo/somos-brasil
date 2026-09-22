import { create } from 'zustand'

export const UPDATE_DISMISS_KEY = 'somos-brasil-update-dismiss'

interface VersionState {
  current: string | null
  updateAvailable: boolean
  markShown: () => void
}

export const useVersionStore = create<VersionState>((set) => ({
  current: null,
  updateAvailable: false,
  markShown: () => set({ updateAvailable: false }),
}))

const META_RE = /<meta[^>]+name="app-version"[^>]+content="([^"]+)"[^>]*>/i
const POLL_MS = 60_000

function readVersion(html: string): string | null {
  const match = html.match(META_RE)
  return match ? match[1] : null
}

async function probeVersion(): Promise<string | null> {
  const url = `${import.meta.env.BASE_URL}index.html?app-version=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'text/html' } })
  if (!res.ok) return null
  return readVersion(await res.text())
}

export function initVersionCheck(): () => void {
  const node = document.querySelector<HTMLMetaElement>('meta[name="app-version"]')
  const current = node ? node.content : null
  if (!current) return () => {}

  useVersionStore.setState({ current })

  const check = async (): Promise<void> => {
    try {
      const fresh = await probeVersion()
      if (fresh && fresh !== current) {
        useVersionStore.setState({ updateAvailable: true })
      }
    } catch {
      // Sin red: no molestar, se reintenta en el próximo poll.
    }
  }

  const onFocus = (): void => {
    void check()
  }

  const onVisible = (): void => {
    if (document.visibilityState === 'visible') void check()
  }

  const interval = window.setInterval(() => void check(), POLL_MS)
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', onVisible)
  void check()

  return () => {
    window.clearInterval(interval)
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onVisible)
  }
}