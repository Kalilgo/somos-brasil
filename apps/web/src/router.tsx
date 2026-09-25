/* oxlint-disable react/only-export-components -- archivo de config de rutas, no es un componente */
import { createBrowserRouter } from 'react-router'
import { Suspense, lazy, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/feedback/LoadingState'
import { RootLayout } from '@/routes/RootLayout'

const UserSelector = lazy(() => import('@/routes/UserSelector').then((m) => ({ default: m.UserSelector })))
const TripsHome = lazy(() => import('@/routes/TripsHome').then((m) => ({ default: m.TripsHome })))
const TripLayout = lazy(() => import('@/routes/TripLayout').then((m) => ({ default: m.TripLayout })))
const TripDashboard = lazy(() => import('@/routes/TripDashboard').then((m) => ({ default: m.TripDashboard })))
const IdeasFeed = lazy(() => import('@/routes/IdeasFeed').then((m) => ({ default: m.IdeasFeed })))
const Itinerary = lazy(() => import('@/routes/Itinerary').then((m) => ({ default: m.Itinerary })))
const TripSummary = lazy(() => import('@/routes/TripSummary').then((m) => ({ default: m.TripSummary })))
const Ranking = lazy(() => import('@/routes/Ranking').then((m) => ({ default: m.Ranking })))
const NotFound = lazy(() => import('@/routes/NotFound').then((m) => ({ default: m.NotFound })))
const LegalLayout = lazy(() =>
  import('@/routes/legal/LegalLayout').then((m) => ({ default: m.LegalLayout })),
)
const TermsPage = lazy(() => import('@/routes/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() =>
  import('@/routes/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const CookiesPage = lazy(() =>
  import('@/routes/legal/CookiesPage').then((m) => ({ default: m.CookiesPage })),
)

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