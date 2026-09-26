import { AnimatePresence, motion } from 'motion/react'
import { useLocation } from 'react-router'
import type { ReactNode } from 'react'

/**
 * Transicion de entrada al cambiar de pagina: la nueva entra con un fade corto
 * y 8px de slide. La anterior no se anima, se va.
 *
 * Antes hacia un cross-fade con `mode="popLayout"`, que dejaba la pagina saliente
 * en `position: absolute`. Eso obliga al contenedor a ser `position: relative` y
 * a recortar, y si algo de eso no encaja la pagina saliente se escapa al
 * documento: infla el alto scrolleable, el scroll salta en cada navegacion y la
 * pagina vieja queda encima de la nueva. Animar solo la entrada tiene las
 * mismas ventajas (no hay elemento saliente que pueda descolocar el layout) y
 * ninguno de esos riesgos:
 * - 160ms de entrada: entra antes de que el ojo registre el cambio.
 * - Solo transform y opacity: van en la GPU, no cuestan layout ni paint.
 * - `initial={false}`: en la carga inicial no hay fade, la app aparece directa.
 * - Sin `exit`, no hay pagina vieja que se lleve los taps ni que ocupe alto.
 *
 * Va montada en dos niveles con keys distintas. Si una sola cubriera todo,
 * cambiar de seccion dentro de un viaje remontaria el header, la nav y su
 * pildora animada en cada clic:
 * - AppShell: key por area ('/viajes' vs '/viajes/abc'). Cambia al entrar o
 *   salir de un viaje, y solo entonces se anima el area entera.
 * - TripLayout: key por pathname. Anima el contenido de la seccion y deja el
 *   chrome del viaje (header, nav, sync) fijo, que es lo que se quiere ver.
 */
export function PageTransition({
  children,
  transitionKey,
}: {
  children: ReactNode
  /** Por defecto, el pathname. Pasalo mas grueso para animar un area entera. */
  transitionKey?: string
}) {
  const location = useLocation()
  const key = transitionKey ?? location.pathname

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
