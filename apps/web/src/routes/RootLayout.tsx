import { Outlet, ScrollRestoration } from 'react-router'
import { ConsentBanner } from '@/components/layout/ConsentBanner'

export function RootLayout() {
  return (
    <>
      <Outlet />
      {/* Key por pathname, no por location.key: cambiar un filtro de ideas reescribe
          la query string y con la key por defecto eso mandaba al scroll a arriba.
          Con pathname, una seccion nueva arranca arriba y el back vuelve al punto
          exacto donde estabas. */}
      <ScrollRestoration getKey={(location) => location.pathname} />
      <ConsentBanner />
    </>
  )
}
