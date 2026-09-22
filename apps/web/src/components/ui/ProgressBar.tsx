import { cn } from '@/lib/utils/cn'

export function ProgressBar({
  value,
  color,
  className,
}: {
  value: number
  color: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-ink/8', className)}
    >
      <div
        className="h-full origin-left rounded-full transition-transform duration-500"
        style={{ transform: `scaleX(${clamped / 100})`, backgroundColor: color }}
      />
    </div>
  )
}