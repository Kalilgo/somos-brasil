import { useState } from 'react'
import { Link } from 'react-router'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useAuthStore } from '@/lib/state/auth'

const PREFIX = 'somos-brasil'

function localKeys(kind: 'local' | 'session'): string[] {
  const storage = kind === 'local' ? localStorage : sessionStorage
  return Object.keys(storage).filter((k) => k.startsWith(PREFIX))
}

function eraseLocalData(): void {
  for (const k of localKeys('local')) localStorage.removeItem(k)
  for (const k of localKeys('session')) sessionStorage.removeItem(k)
}

function downloadLocalData(): void {
  const payload = {
    app: 'Somos Brasil',
    exportedAt: new Date().toISOString(),
    localStorage: Object.fromEntries(localKeys('local').map((k) => [k, localStorage.getItem(k)])),
    sessionStorage: Object.fromEntries(
      localKeys('session').map((k) => [k, sessionStorage.getItem(k)]),
    ),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `somos-brasil-mis-datos-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function MyDataModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logout = useAuthStore((s) => s.logout)
  const [confirmErase, setConfirmErase] = useState(false)

  const erase = () => {
    eraseLocalData()
    logout()
    window.location.reload()
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Mis datos y privacidad" ariaLabel="Mis datos y privacidad">
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-soft">
            En esta pantalla podés ver qué guarda la app en este dispositivo y ejercer tus
            derechos sobre los datos del grupo.
          </p>

          <div className="flex flex-col gap-2 rounded-2xl bg-ink/4 p-4">
            <p className="font-display text-sm font-bold text-ink">Local</p>
            <ul className="list-disc pl-5 text-xs text-ink-soft">
              <li>Identidad y sesión (localStorage)</li>
              <li>Preferencias y avisos descartados</li>
              <li>Solo modo demo: base local de datos de ejemplo</li>
            </ul>
            <p className="text-xs leading-relaxed text-ink-soft">
              Estos datos no salen del dispositivo más allá de lo explicado en la{' '}
              <Link to="/privacidad" className="font-bold text-coral">
                Política de Privacidad
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={downloadLocalData} className="w-full">
              📦 Exportar mis datos locales
            </Button>
            <Button variant="danger" onClick={() => setConfirmErase(true)} className="w-full">
              🗑️ Borrar datos de este dispositivo
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft">
            Borrar datos locales no elimina la información del grupo que ya está en el servidor
            (ideas, votos, comentarios, tu ubicación). Para eso, escribinos a{' '}
            <strong className="text-ink">legal@somosbrasil.app</strong> con asunto "Derechos
            ARCO/LGPD".
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmErase}
        onClose={() => setConfirmErase(false)}
        onConfirm={erase}
        title="¿Borrar todo de este dispositivo?"
        emoji="🧹"
        message="Se borran la identidad, la sesión y las preferencias guardadas en este navegador. Los datos del grupo en el servidor no se tocan. La app se reinicia."
        confirmLabel="Sí, borrar"
        tone="danger"
      />
    </>
  )
}