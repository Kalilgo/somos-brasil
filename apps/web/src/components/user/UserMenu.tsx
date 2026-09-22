import { useNavigate } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { DropdownMenu, MenuItem } from '@/components/ui/DropdownMenu'
import { useAuthStore } from '@/lib/state/auth'

export function UserMenu() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!currentUser) return null

  return (
    <DropdownMenu
      ariaLabel="Menú de usuario"
      trigger={
        <span className="flex items-center gap-2">
          <Avatar
            user={currentUser}
            size="md"
            className="transition-transform hover:scale-105"
          />
        </span>
      }
    >
      {(close) => (
        <>
          <div className="rounded-xl px-3 py-2">
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Estás como
            </p>
            <p className="font-display text-sm font-bold text-ink">
              {currentUser.emoji} {currentUser.name}
            </p>
          </div>
          <div className="mx-2 h-px bg-ink/5" />
          <MenuItem
            onClick={() => {
              close()
              logout()
              navigate('/')
            }}
            className="!text-coral"
          >
            🔄 ¿No sos vos? Cambiar usuario
          </MenuItem>
        </>
      )}
    </DropdownMenu>
  )
}