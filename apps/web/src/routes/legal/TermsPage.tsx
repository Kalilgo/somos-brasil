import { LegalProse, LegalSectionTitle } from '@/routes/legal/LegalLayout'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const CONTACT = 'legal@somosbrasil.app'

export function TermsPage() {
  useDocumentTitle('Términos y condiciones')
  return (
    <LegalProse>
      <div>
        <LegalSectionTitle>Términos y Condiciones</LegalSectionTitle>
        <p className="mt-2">
          Última actualización: 25 de septiembre de 2026. Leelos antes de usar Somos Brasil;
          al entrar y usar la app aceptás estos términos.
        </p>
      </div>

      <section>
        <h2>1. Qué es Somos Brasil</h2>
        <p>
          Somos Brasil es una aplicación de planificación de viajes para un grupo cerrado de
          personas (los "integrantes"). Permite proponer ideas, votarlas, comentarlas, armar un
          itinerario compartido y estimar costos por persona.
        </p>
      </section>

      <section>
        <h2>2. Acceso e identidad</h2>
        <p>
          El acceso se limita a integrantes del grupo. Tu identidad se elige dentro de una
          lista proporcionada por el grupo y, en el entorno conectado, se valida con un PIN
          compartido. El PIN nunca se almacena en tu dispositivo; solo se guarda una sesión
          temporal. Al ser un grupo cerrado, no existe registro público ni creación de cuentas
          individuales.
        </p>
      </section>

      <section>
        <h2>3. Uso permitido</h2>
        <ul className="list-disc pl-6">
          <li>Usar la app únicamente para organizar el viaje del grupo.</li>
          <li>Publicar contenido que no sea ilegal, ofensivo o que invada la privacidad de terceros.</li>
          <li>No intentar acceder a datos de otros grupos ni vulnerar la infraestructura.</li>
          <li>No abusar del sistema de votos, reacciones o comentarios.</li>
        </ul>
      </section>

      <section>
        <h2>4. Contenido que generás</h2>
        <p>
          Las ideas, comentarios, votos, fechas y ubicaciones que ingresás quedan visibles para
          los demás integrantes del grupo y se almacenan en los servidores del servicio. Sos
          responsable del contenido que publicás y del respeto a la privacidad de las personas
          que mencionás (por ejemplo, no compartas direcciones exactas sin consentimiento).
        </p>
      </section>

      <section>
        <h2>5. Disponibilidad y suspensión</h2>
        <p>
          El servicio se ofrece "como está" y puede tener interrupciones para mantenimiento,
          mejoras o fallos. Podemos restringir o pausar el acceso a integrantes que incumplan
          estos términos o abusen del servicio.
        </p>
      </section>

      <section>
        <h2>6. Propiedad intelectual</h2>
        <p>
          La aplicación y la marca Somos Brasil pertenecen a sus responsables. El contenido que
          publican los integrantes les pertenece a ellos y se usa dentro del grupo con el fin de
          organizar el viaje.
        </p>
      </section>

      <section>
        <h2>7. Limitación de responsabilidad</h2>
        <p>
          La app es una herramienta de organización. No garantizamos la exactitud de precios,
          cotizaciones ni la concreción de ningún plan. En la medida que permita la ley, los
          responsables no responden por daños indirectos derivados del uso del servicio.
        </p>
      </section>

      <section>
        <h2>8. Ley aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la República Argentina (Ley de Protección de
          Datos Personales 25.326 y sus normas complementarias). Toda controversia se somete a
          los tribunales de la Ciudad Autónoma de Buenos Aires.
        </p>
      </section>

      <section>
        <h2>9. Cambios en estos términos</h2>
        <p>
          Podemos actualizar estos términos. Si cambian de forma relevante, lo avisamos dentro
          de la app. Seguir usando Somos Brasil después del cambio implica aceptarlos.
        </p>
      </section>

      <section>
        <h2>10. Contacto</h2>
        <p>
          Por dudas sobre estos términos escribinos a <strong className="text-ink">{CONTACT}</strong>.
        </p>
      </section>
    </LegalProse>
  )
}