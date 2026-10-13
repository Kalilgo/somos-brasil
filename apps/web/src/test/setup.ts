import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library limpia solo si detecta el `afterEach` global; lo forzamos para
// que el DOM no se filtre entre tests aunque cambie la config de globals.
afterEach(() => {
  cleanup()
})
