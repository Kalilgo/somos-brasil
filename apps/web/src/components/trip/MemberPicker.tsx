import type { AppUser } from '@/types/db'
import { cn } from '@/lib/utils/cn'

export function MemberPicker({
  users,
  selected,
  onToggle,
}: {
  users: AppUser[]
  selected: string[]
  onToggle: (userId: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Integrantes del viaje">
      {users.map((user) => {
        const active = selected.includes(user.id)
        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onToggle(user.id)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-2 rounded-full border-2 px-3 py-1.5 font-display text-sm font-semibold transition-all',
              active
                ? 'border-transparent text-white shadow-md'
                : 'border-ink/10 bg-white text-ink-soft hover:border-ink/25',
            )}
            style={active ? { backgroundColor: user.color } : undefined}
          >
            <span aria-hidden>{user.emoji}</span>
            {user.name}
            {active && <span aria-hidden>✓</span>}
          </button>
        )
      })}
    </div>
  )
}