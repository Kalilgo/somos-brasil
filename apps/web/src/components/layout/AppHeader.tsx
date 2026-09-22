import { Link } from 'react-router'
import { UserMenu } from '@/components/user/UserMenu'
import { InstallAppButton } from '@/components/layout/InstallAppButton'
import { isDemoMode } from '@/lib/data'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link
          to="/viajes"
          className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink"
        >
          <span className="inline-block animate-wiggle" aria-hidden>
            🇧🇷
          </span>
          Somos<span className="-ml-1.5 text-coral">Brasil</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {isDemoMode && (
            <span className="hidden rounded-full bg-mango/30 px-2.5 py-1 font-display text-xs font-bold text-[#8a5a00] sm:inline-block">
              Modo demo
            </span>
          )}
          <InstallAppButton />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}