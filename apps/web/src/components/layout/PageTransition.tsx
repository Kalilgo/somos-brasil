import { AnimatePresence, motion } from 'motion/react'
import { useLocation } from 'react-router'
import type { ReactNode } from 'react'

/**
 * Transicion entre paginas: cross-fade corto con un slide de 8px.
 * Decisiones, para que no se sienta lento:
 * - `popLayout` saca la pagina saliente del flujo, asi el alto del contenedor
 *   lo define la entrante y no hay salto de layout a mitad de la transicion.
 * - 180ms de entrada y 110ms de salida: entra antes de que el ojo termine de
 *   registrar la salida. Con `mode="wait"` habia un frame vacio.
 * - Solo transform y opacity: van en la GPU y no cuestan layout ni paint.
 * - `initial={false}` en el primer render: en la carga inicial no hay fade, la
 *   app aparece directa.
 *
 * Va montada en dos niveles y cada una con su propia key, porque si una sola
 * cubriera todo, cambiar de seccion dentro de un viaje remontaria el header, la
 * nav y su pildora animada en cada clic:
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
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
