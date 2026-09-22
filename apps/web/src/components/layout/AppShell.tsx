import { Navigate, Outlet, useLocation } from 'react-router'
import { AppHeader } from './AppHeader'
import { Toaster } from '@/components/feedback/Toaster'
import { useAuthStore } from '@/lib/state/auth'

export function AppShell() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:pb-12">
        <Outlet />
      </div>
      <Toaster />
      <span className="sr-only">Ruta: {location.pathname}</span>
    </div>
  )
}