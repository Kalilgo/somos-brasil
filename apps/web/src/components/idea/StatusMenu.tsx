import type { IdeaStatus } from '@/types/db'
import { Badge } from '@/components/ui/Badge'
import { DropdownMenu, MenuItem } from '@/components/ui/DropdownMenu'
import { IDEA_STATUSES } from '@/lib/utils/constants'

export function StatusMenu({
  status,
  onSelect,
}: {
  status: IdeaStatus
  onSelect: (status: IdeaStatus) => void
}) {
  const current = IDEA_STATUSES[status]
  return (
    <DropdownMenu
      ariaLabel="Cambiar estado de la idea"
      trigger={
        <Badge tone={status} className="cursor-pointer px-3 py-1 text-xs uppercase tracking-wide">
          {current.emoji} {current.label} ▾
        </Badge>
      }
    >
      {(close) => (
        <div className="flex flex-col gap-0.5">
          {(Object.keys(IDEA_STATUSES) as IdeaStatus[]).map((st) => {
            const opt = IDEA_STATUSES[st]
            const active = st === status
            return (
              <MenuItem
                key={st}
                onClick={() => {
                  onSelect(st)
                  close()
                }}
                className={active ? 'bg-ink/5 text-ink' : ''}
              >
                <span aria-hidden>{opt.emoji}</span>
                {opt.label}
                {active && <span className="ml-auto text-verde">✓</span>}
              </MenuItem>
            )
          })}
        </div>
      )}
    </DropdownMenu>
  )
}