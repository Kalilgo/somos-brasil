/* oxlint-disable react/only-export-components -- archivo de config de rutas, no es un componente */
import { createBrowserRouter } from 'react-router'
import { Suspense, lazy, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/feedback/LoadingState'
import { RootLayout } from '@/routes/RootLayout'
import { loaders } from '@/routes/lazyRoutes'

const UserSelector = lazy(() => loaders.userSelector().then((m) => ({ default: m.UserSelector })))
const TripsHome = lazy(() => loaders.tripsHome().then((m) => ({ default: m.TripsHome })))
const TripLayout = lazy(() => loaders.tripLayout().then((m) => ({ default: m.TripLayout })))
const TripDashboard = lazy(() => loaders.dashboard().then((m) => ({ default: m.TripDashboard })))
const IdeasFeed = lazy(() => loaders.ideas().then((m) => ({ default: m.IdeasFeed })))
const Itinerary = lazy(() => loaders.itinerary().then((m) => ({ default: m.Itinerary })))
const TripSummary = lazy(() => loaders.summary().then((m) => ({ default: m.TripSummary })))
const Ranking = lazy(() => loaders.ranking().then((m) => ({ default: m.Ranking })))
const NotFound = lazy(() => loaders.notFound().then((m) => ({ default: m.NotFound })))
const LegalLayout = lazy(() => loaders.legalLayout().then((m) => ({ default: m.LegalLayout })))
const TermsPage = lazy(() => loaders.terms().then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => loaders.privacy().then((m) => ({ default: m.PrivacyPage })))
const CookiesPage = lazy(() => loaders.cookies().then((m) => ({ default: m.CookiesPage })))

function load(node: ReactNode): ReactNode {
  return <Suspense fallback={<LoadingState />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: load(<UserSelector />) },
      {
        element: <AppShell />,
        children: [
          { path: '/viajes', element: load(<TripsHome />) },
          {
            path: '/viajes/:tripId',
            element: load(<TripLayout />),
            children: [
              { index: true, element: load(<TripDashboard />) },
              { path: 'ideias', element: load(<IdeasFeed />) },
              { path: 'itinerario', element: load(<Itinerary />) },
              { path: 'resumo', element: load(<TripSummary />) },
              { path: 'ranking', element: load(<Ranking />) },
            ],
          },
          { path: '*', element: load(<NotFound />) },
        ],
      },
      {
        element: load(<LegalLayout />),
        children: [
          { path: '/terminos', element: load(<TermsPage />) },
          { path: '/privacidad', element: load(<PrivacyPage />) },
          { path: '/cookies', element: load(<CookiesPage />) },
        ],
      },
    ],
  },
])