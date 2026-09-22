import { useRef, type KeyboardEvent } from 'react'
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
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return

    e.preventDefault()
    onChange(items[next].value)
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons?.[next]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Secciones del viaje"
      aria-orientation="horizontal"
      className={cn(
        'flex gap-1.5 overflow-x-auto rounded-full bg-ink/5 p-1.5 no-scrollbar sm:max-w-fit',
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            tabIndex={active ? 0 : -1}
            aria-selected={active}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'relative whitespace-nowrap rounded-full px-4 py-2 font-display text-sm font-semibold outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none',
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