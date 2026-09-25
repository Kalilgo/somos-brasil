import { Outlet } from 'react-router'
import { ConsentBanner } from '@/components/layout/ConsentBanner'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <ConsentBanner />
    </>
  )
}
