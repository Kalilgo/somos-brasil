import { Component, type ReactNode } from 'react'
import { CHUNK_RETRY_KEY, isChunkLoadError } from '@/lib/chunk'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    if (!isChunkLoadError(error)) return

    if (sessionStorage.getItem(CHUNK_RETRY_KEY) === '1') {
      sessionStorage.removeItem(CHUNK_RETRY_KEY)
      return
    }

    sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    if (!isChunkLoadError(this.state.error)) {
      throw this.state.error
    }

    return (
      <div className="grid min-h-dvh place-items-center bg-cream px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card-lg">
          <span className="text-5xl" aria-hidden>
            🔄
          </span>
          <h1 className="mt-3 font-display text-xl font-extrabold text-ink">
            Parece que hay una actualización
          </h1>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            La app cambió de versión mientras la tenías abierta. Recargá para cargar lo nuevo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 min-h-11 rounded-full bg-ink px-4 py-2 font-display text-sm font-bold text-white transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
          >
            🚀 Recargar ahora
          </button>
        </div>
      </div>
    )
  }
}