import { useRouteError, isRouteErrorResponse, Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/**
 * Pantalla de error del router.
 *
 * Sin esto, React Router renderiza su "Unexpected Application Error!" pelado, con
 * un stack en inglés y ninguna salida: sin boton de reintentar, sin forma de volver
 * al inicio. Para un grupo que no se dica en desarrollo, es un callejon sin salida
 * en medio del viaje.
 *
 * Se registra como `errorElement` en la ruta raiz, asi que cubre cualquier error de
 * render de cualquier seccion, y no hace falta que cada pantalla se proteja.
 */
export function RouteError() {
  const error = useRouteError()
  useDocumentTitle('Algo se rompió')

  const es404 = isRouteErrorResponse(error) && error.status === 404
  const detalle =
    isRouteErrorResponse(error) && error.status === 403
      ? 'No tenés acceso a esto.'
      : es404
        ? 'Esta página no existe o cambió de dirección.'
        : 'La app se cayó al mostrar esta pantalla. Tus datos están guardados.'

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card-lg">
        <span className="text-5xl" aria-hidden>
          {es404 ? '🦤' : '🥴'}
        </span>
        <h1 className="mt-3 font-display text-xl font-extrabold text-ink">
          {es404 ? 'Uy, esto no existe' : 'Algo se rompió por acá'}
        </h1>
        <p className="mt-1 text-sm font-medium text-ink-soft">{detalle}</p>

        {import.meta.env.DEV && error instanceof Error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs font-bold text-ink-soft">
              Detalle técnico
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-2xl bg-cream p-3 text-left text-[11px] leading-relaxed text-ink-soft">
              {error.message}
              {'\n\n'}
              {error.stack?.split('\n').slice(1, 6).join('\n')}
            </pre>
          </details>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => window.location.assign('/')}>🏠 Ir al inicio</Button>
          <Link to="/viajes">
            <Button variant="ghost">🧳 Mis viajes</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
