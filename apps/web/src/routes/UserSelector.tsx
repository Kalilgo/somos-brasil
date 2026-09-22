import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, type Variants } from 'motion/react'
import type { AppUser } from '@/types/db'
import { repo } from '@/lib/data'
import { useAuthStore } from '@/lib/state/auth'
import { toastSuccess } from '@/lib/state/toasts'
import { fireCelebration } from '@/components/feedback/Confetti'
import { cn } from '@/lib/utils/cn'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const profile: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 280 } },
}

export function UserSelector() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser)
  const navigate = useNavigate()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    repo()
      .listUsers()
      .then((u) => alive && setUsers(u))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const pick = (user: AppUser) => {
    setCurrentUser(user)
    fireCelebration()
    toastSuccess(`¡Bienvenido/a ${user.name}!`, user.emoji)
    navigate('/viajes')
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-[#130f0d] text-white">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-coral/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-verde/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-mango/10 blur-3xl" />

      <header className="relative mx-auto w-full max-w-5xl px-4 pt-8 sm:pt-10">
        <p className="font-display text-2xl font-extrabold tracking-tight">
          🇧🇷 Somos<span className="text-coral">Brasil</span>
        </p>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 240 }}
          className="text-center font-display text-3xl font-extrabold text-white sm:text-4xl"
        >
          ¿Quién está viendo?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-center font-display text-base font-semibold text-white/55"
        >
          Elegí tu card y empecemos a armar el viaje 💃
        </motion.p>

        {loading ? (
          <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6"
          >
            {users.map((user) => {
              const active = currentUser?.id === user.id
              return (
                <motion.button
                  key={user.id}
                  type="button"
                  variants={profile}
                  onClick={() => pick(user)}
                  className="group flex flex-col items-center gap-2 rounded-3xl p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130f0d]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid aspect-square w-full place-items-center rounded-2xl text-5xl shadow-xl transition duration-200 group-hover:scale-[1.06]',
                      active
                        ? 'ring-4 ring-coral group-hover:ring-coral'
                        : 'ring-2 ring-white/15 group-hover:ring-white/70',
                    )}
                    style={{ backgroundColor: user.color }}
                  >
                    {user.emoji}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 font-display text-sm font-bold transition-colors',
                      active ? 'text-coral' : 'text-white/70 group-hover:text-white',
                    )}
                  >
                    {user.name}
                    {active && (
                      <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-xs font-extrabold uppercase tracking-wide">
                        Vos
                      </span>
                    )}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}

        <p className="mt-10 max-w-sm text-center text-sm font-medium leading-relaxed text-white/45">
          Cualquiera puede sumarse al toque: elegí tu card y arrancamos. Tu elección queda guardada
          en este dispositivo.
        </p>
      </main>
    </div>
  )
}