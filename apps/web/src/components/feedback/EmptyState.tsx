import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function EmptyState({
  emoji,
  title,
  cta,
  onAction,
  actionLabel,
}: {
  emoji: string
  title: string
  cta?: string
  onAction?: () => void
  actionLabel?: string
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <span className="animate-float-slow mb-4 text-6xl" aria-hidden>
        {emoji}
      </span>
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      {cta && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{cta}</p>}
      {onAction && actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}