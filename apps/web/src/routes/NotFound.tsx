import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Página no encontrada')
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="animate-wiggle inline-block text-6xl" aria-hidden>
        🦤
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">Uy, esto no existe</h1>
      <p className="mt-2 max-w-sm text-sm font-medium text-ink-soft">
        El dodo no encontró esa página. Puede que la hayas escrito mal o que se haya escapado con
        el grupo.
      </p>
      <Link to="/viajes" className="mt-6">
        <Button>Volver a mis viajes 🧳</Button>
      </Link>
    </div>
  )
}