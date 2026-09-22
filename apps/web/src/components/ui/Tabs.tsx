import { motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'

export interface TabItem {
  value: string
  label: string
  emoji?: string
}

export interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1.5 overflow-x-auto rounded-full bg-ink/5 p-1.5 no-scrollbar sm:max-w-fit',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative whitespace-nowrap rounded-full px-4 py-2 font-display text-sm font-semibold outline-none transition-colors',
              active ? 'text-white' : 'text-ink-soft hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-ink shadow-card"
                transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {item.emoji && <span aria-hidden>{item.emoji}</span>}
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}