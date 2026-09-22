import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import type { AppUser } from '@/types/db'
import { repo } from '@/lib/data'
import { useAuthStore } from '@/lib/state/auth'
import { toastSuccess } from '@/lib/state/toasts'
import { fireCelebration } from '@/components/feedback/Confetti'
import { LoadingState } from '@/components/feedback/LoadingState'

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

  if (currentUser) return <Navigate to="/viajes" replace />

  const pick = (user: AppUser) => {
    setCurrentUser(user)
    fireCelebration()
    toastSuccess(`¡Bienvenido/a ${user.name}!`, user.emoji)
    navigate('/viajes')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <header className="mb-8 text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 220 }}
          className="mb-3 inline-block text-6xl"
          aria-hidden
        >
          🇧🇷
        </motion.span>
        <h1 className="font-display text-4xl font-extrabold text-ink">
          Somos<span className="text-coral">Brasil</span>
        </h1>
        <p className="mt-2 font-display text-lg font-semibold text-ink-soft">
          ¿Quién sos? Elegí tu card y armemos el viaje 💃
        </p>
      </header>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {users.map((user, i) => (
            <motion.button
              key={user.id}
              onClick={() => pick(user)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', damping: 20, stiffness: 300 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2.5 rounded-[28px] border-2 border-white p-5 shadow-card transition-shadow hover:shadow-card-lg focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:outline-none"
              style={{ backgroundColor: `${user.color}1A` }}
            >
              <span
                className="grid h-16 w-16 place-items-center rounded-full text-3xl shadow-md"
                style={{ backgroundColor: user.color }}
                aria-hidden
              >
                {user.emoji}
              </span>
              <span className="font-display text-base font-extrabold tracking-wide text-ink">
                {user.name}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs font-medium text-ink-soft">
        Tu elección queda guardada en este dispositivo. ¿No sos vos? Cualquiera puede cambiar desde el menú del avatar.
      </p>
    </div>
  )
}