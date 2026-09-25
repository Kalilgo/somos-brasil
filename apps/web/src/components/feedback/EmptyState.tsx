import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function EmptyState({
  emoji,
  title,
  cta,
  onAction,
  actionLabel,
  as = 'h3',
}: {
  emoji: string
  title: string
  cta?: string
  onAction?: () => void
  actionLabel?: string
  /** Nivel del heading: usá 'h2' cuando la pantalla ya tiene su propio h1. */
  as?: 'h2' | 'h3'
}) {
  const Heading = as
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <span className="animate-float-slow mb-4 text-6xl" aria-hidden>
        {emoji}
      </span>
      <Heading className="font-display text-xl font-bold text-ink">{title}</Heading>
      {cta && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{cta}</p>}
      {onAction && actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}