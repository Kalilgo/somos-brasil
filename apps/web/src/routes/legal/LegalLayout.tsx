import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router'

const updated = new Date('2026-09-25')

export function LegalLayout() {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-3xl items-center justify-between gap-3 px-4 py-2">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink"
          >
            <span className="inline-block animate-wiggle" aria-hidden>
              🇧🇷
            </span>
            Somos<span className="-ml-1.5 text-coral">Brasil</span>
          </Link>
          <Link
            to="/viajes"
            className="flex min-h-11 items-center rounded-full px-3 font-display text-sm font-bold text-ink transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
          >
            ← La app
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <footer className="border-t border-ink/5">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs font-medium text-ink-soft">
          <p>Somos Brasil — planificación de viajes en grupo.</p>
          <p>
            Última actualización:{' '}
            <time dateTime={updated.toISOString()}>
              {updated.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
          </p>
        </div>
      </footer>
    </div>
  )
}

export function LegalProse({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-ink-soft [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-ink-soft">{children}</div>
}

export function LegalSectionTitle({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-3xl font-extrabold leading-tight text-ink">{children}</h1>
}