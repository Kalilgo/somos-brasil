import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!deferred) return null

  const install = async () => {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
  }

  return (
    <button
      onClick={() => void install()}
      className="inline-flex h-10 select-none items-center gap-1 rounded-full bg-ink/5 px-3 font-display text-xs font-bold text-ink outline-none transition hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-coral/70 sm:hidden"
    >
      <span aria-hidden>📲</span> Instalar
    </button>
  )
}