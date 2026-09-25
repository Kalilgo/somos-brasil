import { Link } from 'react-router'
import { LegalProse, LegalSectionTitle } from '@/routes/legal/LegalLayout'

const CONTACT = 'legal@somosbrasil.app'

export function PrivacyPage() {
  return (
    <LegalProse>
      <div>
        <LegalSectionTitle>Política de Privacidad</LegalSectionTitle>
        <p className="mt-2">
          Última actualización: 25 de septiembre de 2026. Esta política explica qué datos
          tratamos, para qué, dónde se guardan y qué derechos tenés (Ley Argentina 25.326,
          y referencias a LGPD / RGPD como buenas prácticas).
        </p>
      </div>

      <section>
        <h2>1. Responsable</h2>
        <p>
          Responsable del tratamiento: los responsables de la aplicación Somos Brasil, para uso
          de un grupo cerrado de viajeros. Consultas: <strong className="text-ink">{CONTACT}</strong>.
        </p>
      </section>

      <section>
        <h2>2. Qué datos tratamos y para qué</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong className="text-ink">Identidad en el grupo</strong> (nombre, emoji y color de
            tarjeta elegida): para que sepa quién propone, vota y comenta.
          </li>
          <li>
            <strong className="text-ink">Datos del viaje</strong> (nombre, fechas, moneda,
            descripción): para organizar el viaje.
          </li>
          <li>
            <strong className="text-ink">Ideas, votos, reacciones y comentarios</strong>: para la
            planificación colaborativa.
          </li>
          <li>
            <strong className="text-ink">Fechas y ubicación textual de cada integrante</strong>{' '}
            ("¿dónde vas a estar?", por ejemplo un alojamiento): para coordinar llegadas. Es el
            dato más sensible que tratamos, por eso pedimos que compartas solo lo necesario.
          </li>
          <li>
            <strong className="text-ink">Dirección IP</strong>: la usamos de forma transitoria
            (~24 h) para prevenir abusos y ataques, no para perfilarte.
          </li>
          <li>
            <strong className="text-ink">Suscripciones a notificaciones push</strong> (endpoint
            del navegador): para avisarte novedades del grupo si lo activás.
          </li>
        </ul>
        <p>
          No pedimos ni tratamos email, teléfono, documento de identidad, fecha de nacimiento,
          fotos reales ni geolocalización GPS.
        </p>
      </section>

      <section>
        <h2>3. Base legal</h2>
        <p>
          Tratamos los datos con tu consentimiento (que otorgás al elegir tu identidad y usar la
          app) y en la medida necesaria para prestar el servicio del grupo. Para la ubicación
          textual pedimos expresa prudencia porque puede revelar dónde te alojás.
        </p>
      </section>

      <section>
        <h2>4. Datos en tu dispositivo</h2>
        <p>
          La app guarda en tu navegador (almacenamiento local, no cookies de seguimiento) tu
          identidad, la sesión temporal y tus preferencias, para que no tengas que volver a
          elegirlas. Podés borrarlos desde el menú de usuario → "Mis datos". Ver la{' '}
          <Link to="/cookies" className="font-bold text-coral">
            Política de Cookies
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>5. Con quién compartimos datos</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong className="text-ink">Los integrantes del grupo</strong>: tus ideas, votos,
            comentarios, fechas y ubicación son visibles para ellos (es el propósito del grupo).
          </li>
          <li>
            <strong className="text-ink">Vercel</strong>, como proveedor de hosting de la web.
          </li>
          <li>
            <strong className="text-ink">Supabase</strong>, como base de datos y funciones del
            servidor.
          </li>
          <li>
            <strong className="text-ink">Proveedores de notificaciones push</strong> del
            navegador (FCM / APNs / Mozilla) solo si activás las notificaciones.
          </li>
        </ul>
        <p>No vendemos ni cedemos tus datos a anunciantes ni a terceros con fines de marketing.</p>
      </section>

      <section>
        <h2>6. Transferencias internacionales</h2>
        <p>
          Los servidores (Vercel y Supabase) pueden estar fuera de Argentina o Brasil. Al usar la
          app aceptás que tus datos viajen a dichos servidores bajo contratos de tratamiento con
          las garantías habituales del mercado.
        </p>
      </section>

      <section>
        <h2>7. Conservación</h2>
        <p>
          Los datos del grupo se conservan mientras la app esté activa para ese viaje. La IP con
          fines de seguridad se descarta a las ~24 h. Podés solicitar la baja de tus datos
          cuando quieras.
        </p>
      </section>

      <section>
        <h2>8. Tus derechos</h2>
        <p>
          Podés ejercer los derechos de acceso, rectificación, actualización y supresión de tus
          datos, y los equivalentes del RGPD/LGPD (portabilidad, oposición, revocación del
          consentimiento). En la app tenés las herramientas de "Exportar mis datos" y "Borrar
          datos locales" en el menú de usuario.
        </p>
        <p>
          Para lo que no se pueda resolver desde la app, escribinos a{' '}
          <strong className="text-ink">{CONTACT}</strong> con el asunto "Derechos ARCO/LGPD" y tu
          nombre de tarjeta en el grupo. Respondemos en plazo legal.
        </p>
      </section>

      <section>
        <h2>9. Seguridad</h2>
        <p>
          Las escrituras se validan contra el servidor con sesión firmada, límites de longitud en
          los campos, rate limiting por IP y por usuario, y políticas de acceso a nivel de base
          de datos. Ningún sistema es infalible; si detectás un problema, avisanos.
        </p>
      </section>

      <section>
        <h2>10. Menores</h2>
        <p>
          La app está pensada para mayores de 16 años. Quienes administran el grupo deben asegurarse
          de que los integrantes cumplan esta condición.
        </p>
      </section>

      <section>
        <h2>11. Cambios</h2>
        <p>
          Si cambia esta política, lo avisamos dentro de la app y actualizamos la fecha al
          comienzo de este documento.
        </p>
      </section>
    </LegalProse>
  )
}