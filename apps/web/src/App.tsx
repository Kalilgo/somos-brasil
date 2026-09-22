import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router'
import { router } from '@/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </ErrorBoundary>
  )
}