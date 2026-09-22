import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary capturó un error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-dvh place-items-center bg-cream px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card-lg">
          <span className="text-5xl" aria-hidden>
            🥴
          </span>
          <h1 className="mt-3 font-display text-xl font-extrabold text-ink">
            Algo se rompió por acá
          </h1>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            Crash descontrolado, pero la app sigue viva. Recargá y seguimos planificando.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="min-h-11 rounded-full bg-ink px-4 py-2 font-display text-sm font-bold text-white transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
            >
              🛠️ Intentar de nuevo
            </button>
            <a
              href="/"
              className="min-h-11 rounded-full bg-cream px-4 py-2 font-display text-sm font-bold text-ink transition-transform active:scale-95"
            >
              🏠 Ir al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }
}