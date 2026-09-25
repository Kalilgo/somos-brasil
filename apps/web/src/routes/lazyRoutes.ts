/**
 * Los imports de cada ruta en un solo lugar, para que `lazy()` y la precarga
 * por hover usen exactamente el mismo chunk. Si se duplicaran las rutas, un
 * typo en una de las dos seria un chunk faltante en produccion.
 */
export const loaders = {
  userSelector: () => import('@/routes/UserSelector'),
  tripsHome: () => import('@/routes/TripsHome'),
  tripLayout: () => import('@/routes/TripLayout'),
  dashboard: () => import('@/routes/TripDashboard'),
  ideas: () => import('@/routes/IdeasFeed'),
  itinerary: () => import('@/routes/Itinerary'),
  summary: () => import('@/routes/TripSummary'),
  ranking: () => import('@/routes/Ranking'),
  notFound: () => import('@/routes/NotFound'),
  legalLayout: () => import('@/routes/legal/LegalLayout'),
  terms: () => import('@/routes/legal/TermsPage'),
  privacy: () => import('@/routes/legal/PrivacyPage'),
  cookies: () => import('@/routes/legal/CookiesPage'),
} as const

export type RouteKey = keyof typeof loaders

const sectionForValue: Record<string, RouteKey> = {
  inicio: 'dashboard',
  ideas: 'ideas',
  itinerario: 'itinerary',
  resumo: 'summary',
  ranking: 'ranking',
}

const warmed = new Set<RouteKey>()

/**
 * Descarga el chunk de la seccion sin montarla. Se dispara al hacer hover o
 * focus en una tab: para cuando el dedo toca, el bundle ya esta en memoria y la
 * navegacion se siente instantanea en vez de mostrar un loader.
 */
export function preloadSection(value: string): void {
  const key = sectionForValue[value]
  if (!key || warmed.has(key)) return
  warmed.add(key)
  void loaders[key]().catch(() => {
    warmed.delete(key)
  })
}
