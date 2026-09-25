import { useEffect } from 'react'

const SUFFIX = 'SomosBrasil'

/** El título de la pestaña dice dónde estás: en PWA es lo único que se ve en el switcher. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    const clean = title?.trim()
    document.title = clean ? `${clean} · ${SUFFIX}` : SUFFIX
    return () => {
      document.title = SUFFIX
    }
  }, [title])
}
