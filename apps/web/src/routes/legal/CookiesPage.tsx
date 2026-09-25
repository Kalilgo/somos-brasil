import { Link } from 'react-router'
import { LegalProse, LegalSectionTitle } from '@/routes/legal/LegalLayout'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function CookiesPage() {
  useDocumentTitle('Cookies')
  return (
    <LegalProse>
      <div>
        <LegalSectionTitle>Política de Cookies</LegalSectionTitle>
        <p className="mt-2">
          Última actualización: 25 de septiembre de 2026. En Somos Brasil la privacidad es
          simple: <strong className="text-ink">no usamos cookies de seguimiento, publicidad ni analítica de terceros</strong>.
          Lo que sí usamos son mecanismos de almacenamiento técnico del navegador, necesarios
          para que la app funcione.
        </p>
      </div>

      <section>
        <h2>1. Qué es una cookie</h2>
        <p>
          Una cookie es un pequeño archivo que el sitio guarda en tu dispositivo. El navegador
          moderno también ofrece otros almacenamientos locales (localStorage, sessionStorage) y
          una caché propia. Esta política cubre todos esos mecanismos.
        </p>
      </section>

      <section>
        <h2>2. Qué guarda la app en tu dispositivo</h2>
        <p>Todas las claves son puramente técnicas y funcionales (no te identifican ante publicidad):</p>
        <ul className="list-disc pl-6">
          <li>
            <strong className="text-ink">somos-brasil-user</strong> — tu identidad elegida y la
            sesión temporal para que no vuelvas a elegirla cada vez.
          </li>
          <li>
            <strong className="text-ink">somos-brasil-consent</strong> — tu elección sobre este
            aviso de privacidad.
          </li>
          <li>
            <strong className="text-ink">somos-brasil-demo-db</strong> — solo en modo demo: los
            datos de ejemplo guardados en tu navegador para probar la app sin conexión.
          </li>
          <li>
            <strong className="text-ink">somos-brasil-push-dismiss</strong> y variantes —
            recordatorios transitorios (si descartaste un aviso de notificaciones o de
            actualización).
          </li>
        </ul>
        <p>
          Ninguna de estas claves sale de tu dispositivo hacia terceros fuera de lo que ya se
          explica en la{' '}
          <Link to="/privacidad" className="font-bold text-coral">
            Política de Privacidad
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>3. Cookies de terceros</h2>
        <p>
          No cargamos scripts de publicidad, analítica, mapas ni redes sociales. No hay cookies
          de terceros. Las fuentes tipográficas están alojadas en nuestros propios servidores.
        </p>
      </section>

      <section>
        <h2>4. Cómo gestionarlas</h2>
        <p>
          Podés borrar todos los datos locales desde el menú de usuario → "Mis datos" → "Borrar
          datos locales". También podés limpiar desde la configuración de tu navegador
          (historial → datos de sitios). Si borrás tu identidad, la próxima vez tendrás que
          volver a elegirla.
        </p>
      </section>

      <section>
        <h2>5. Cambios</h2>
        <p>
          Avísaremos dentro de la app si sumamos algún mecanismo de almacenamiento nuevo que
          afecte esta política.
        </p>
      </section>
    </LegalProse>
  )
}