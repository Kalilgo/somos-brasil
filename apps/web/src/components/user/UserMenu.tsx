import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { DropdownMenu, MenuItem } from '@/components/ui/DropdownMenu'
import { useAuthStore } from '@/lib/state/auth'
import { MyDataModal } from '@/components/user/MyDataModal'

export function UserMenu() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()
  const [myDataOpen, setMyDataOpen] = useState(false)

  if (!currentUser) return null

  return (
    <>
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
                setMyDataOpen(true)
              }}
            >
              🔐 Mis datos y privacidad
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                navigate('/')
              }}
              className="!text-coral"
            >
              🔄 ¿No sos vos? Cambiar usuario
            </MenuItem>
            <div className="mx-2 h-px bg-ink/5" />
            <div className="px-3 py-2">
              <nav aria-label="Documentación legal">
                <ul className="flex flex-col gap-1">
                  <li>
                    <Link
                      to="/terminos"
                      onClick={close}
                      className="inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      Términos
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacidad"
                      onClick={close}
                      className="inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/cookies"
                      onClick={close}
                      className="inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      Política de Cookies
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </>
        )}
      </DropdownMenu>
      <MyDataModal open={myDataOpen} onClose={() => setMyDataOpen(false)} />
    </>
  )
}