import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { AppHeader } from './AppHeader'
import { Toaster } from '@/components/feedback/Toaster'
import { useAuthStore } from '@/lib/state/auth'
import { useTripsStore } from '@/lib/state/trips'
import { isDemoMode } from '@/lib/data'
import { activeToken } from '@/lib/data/session'
import { setSessionToken } from '@/lib/supabase/client'

export function AppShell() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const location = useLocation()
  const loadCategories = useTripsStore((s) => s.loadCategories)

  useEffect(() => {
    void loadCategories().catch(() => {})
  }, [loadCategories])

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  // En modo real, aunque haya usuario elegido, sin sesión válida volvé a elegir con PIN.
  if (!isDemoMode && !activeToken()) {
    setSessionToken(null)
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-full bg-ink px-4 py-2 font-display text-sm font-bold text-white shadow-card-lg transition-transform focus:translate-y-0 focus-visible:outline-none"
      >
        Saltar al contenido
      </a>
      <AppHeader />
      <div
        id="contenido"
        className="mx-auto w-full max-w-5xl flex-1 scroll-mt-20 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:pb-12"
      >
        <Outlet />
      </div>
      <Toaster />
      <span className="sr-only">Ruta: {location.pathname}</span>
    </div>
  )
}