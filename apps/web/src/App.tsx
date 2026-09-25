import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router'
import { router } from '@/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { CHUNK_RETRY_KEY } from '@/lib/chunk'
import { ChunkErrorBoundary } from '@/components/feedback/ChunkErrorBoundary'
import { UpdateBanner } from '@/components/feedback/UpdateBanner'
import { ConsentBanner } from '@/components/layout/ConsentBanner'

export default function App() {
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
  }, [])

  return (
    <ErrorBoundary>
      <ChunkErrorBoundary>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
          <ConsentBanner />
        </MotionConfig>
      </ChunkErrorBoundary>
      <UpdateBanner />
    </ErrorBoundary>
  )
}