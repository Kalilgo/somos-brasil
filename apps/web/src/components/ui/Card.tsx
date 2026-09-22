import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-ink/5 bg-white shadow-card',
        'transition duration-200',
        className,
      )}
      {...rest}
    />
  )
}

export function CardClickable({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-lg active:scale-[0.99]',
        className,
      )}
      {...rest}
    />
  )
}