import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'default' | 'proposal' | 'discussing' | 'confirmed' | 'discarded' | 'category'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

const tones: Record<Tone, string> = {
  default: 'bg-ink/8 text-ink-soft',
  proposal: 'bg-sky/15 text-sky',
  discussing: 'bg-mango/25 text-[#8a5a00]',
  confirmed: 'bg-verde/15 text-verde-dark',
  discarded: 'bg-ink/10 text-ink-soft',
  category: 'bg-white text-ink border border-ink/10',
}

export function Badge({ tone = 'default', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}