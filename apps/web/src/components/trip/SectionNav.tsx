import { useLocation, useNavigate, useParams } from 'react-router'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { preloadSection } from '@/routes/lazyRoutes'
import { cn } from '@/lib/utils/cn'

const items: TabItem[] = [
  { value: 'inicio', label: 'Inicio', emoji: '🏠' },
  { value: 'ideias', label: 'Ideas', emoji: '💡' },
  { value: 'itinerario', label: 'Itinerario', emoji: '🗓️' },
  { value: 'resumo', label: 'Resumen', emoji: '💰' },
  { value: 'ranking', label: 'Ranking', emoji: '🏆' },
]

export function SectionNav({ className }: { className?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { tripId } = useParams()
  const path = (location.pathname.split('/').pop() ?? '') as string
  const active = items.some((i) => i.value === path) ? path : 'inicio'

  return (
    <Tabs
      items={items}
      value={active}
      onChange={(v) => navigate(v === 'inicio' ? `/viajes/${tripId}` : `/viajes/${tripId}/${v}`)}
      onIntent={preloadSection}
      className={cn('mx-auto w-full justify-start sm:justify-center', className)}
    />
  )
}