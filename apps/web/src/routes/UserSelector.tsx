import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { motion, type Variants } from 'motion/react'
import type { AppUser } from '@/types/db'
import { repo, isDemoMode } from '@/lib/data'
import { useAuthStore } from '@/lib/state/auth'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { toastError, toastSuccess } from '@/lib/state/toasts'
import { fireCelebration } from '@/components/feedback/Confetti'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { activateUserToken, loginWithPin } from '@/lib/data/session'
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
  const lastUserId = useAuthStore((s) => s.lastUserId)
  const navigate = useNavigate()
  const location = useLocation()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [pinUser, setPinUser] = useState<AppUser | null>(null)
  const [pin, setPin] = useState('')
  const [pinBusy, setPinBusy] = useState(false)

  useDocumentTitle('¿Quién está viendo?')

  useEffect(() => {
    let alive = true
    repo()
      .listUsers()
      .then((u) => alive && setUsers(u))
      .catch((e: unknown) => {
        if (!alive) return
        setLoadError(e instanceof Error ? e.message : 'No pudimos cargar a los integrantes')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [attempt])

  useAutoRefresh(() => {
    repo()
      .listUsers()
      .then(setUsers)
      .catch(() => {})
  }, true)

  const retryLoad = () => {
    setLoadError(null)
    setLoading(true)
    setAttempt((n) => n + 1)
  }

  // Si ya sabemos quién es, "seguí como Ana" es un tap en vez de elegir entre
  // seis. El selector completo queda a un toque de distancia.
  const lastUser = users.find((u) => u.id === lastUserId) ?? null
  const showPicker = showAll || !lastUser

  const finish = (user: AppUser) => {
    setCurrentUser(user)
    fireCelebration()
    toastSuccess(`¡Bienvenido/a ${user.name}!`, user.emoji)
    const back = (location.state as { from?: string } | null)?.from
    navigate(back ?? '/viajes')
  }

  const pick = (user: AppUser) => {
    if (isDemoMode || activateUserToken(user.id)) {
      finish(user)
      return
    }
    setPinUser(user)
    setPin('')
  }

  const submitPin = async (e: FormEvent) => {
    e.preventDefault()
    if (!pinUser || pinBusy) return
    setPinBusy(true)
    try {
      await loginWithPin(pinUser, pin)
      setPinUser(null)
      finish(pinUser)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'PIN incorrecto')
      setPin('')
    } finally {
      setPinBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-cover bg-center text-white" style={{ backgroundImage: `url('/Gemini_Generated_Image_8ay9zm8ay9zm8ay9.jpeg')` }}>
        <div className="absolute inset-0 bg-[#130f0d]/60" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-coral/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-verde/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-mango/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-coral/10 blur-3xl animate-glow-strong" />
        <div aria-hidden className="pointer-events-none absolute bottom-1/4 left-1/6 h-80 w-80 rounded-full bg-verde/10 blur-3xl animate-glow" />
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-mango/5 blur-3xl animate-glow-strong" />
        <div aria-hidden className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-rosa/15 blur-3xl animate-glow" />

      <header className="relative mx-auto w-full max-w-5xl px-4 pt-8 sm:pt-10">
        <p className="font-display text-2xl font-extrabold tracking-tight">
          🇧🇷 Somos<span className="text-coral">Brasil</span>
        </p>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
<motion.h1
           initial={{ opacity: 0, scale: 0.92 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ type: 'spring', damping: 20, stiffness: 240 }}
           className="text-center font-display text-3xl font-extrabold text-white sm:text-4xl drop-shadow-[0_0_20px_rgba(255,90,95,0.5)] drop-shadow-[0_0_40px_rgba(255,90,95,0.2)]"
         >
           ¿Quién está viendo?
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="mt-2 text-center font-display text-base font-semibold text-white/55 drop-shadow-[0_0_10px_rgba(255,201,60,0.3)]"
         >
            {lastUser && !showPicker ? 'Retomá donde lo dejaron, en un toque' : 'Elegí tu card y empecemos a armar el viaje 💃'}
         </motion.p>

        {loading ? (
          <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="mt-10 flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm"
          >
            <span className="text-4xl" aria-hidden>
              📡
            </span>
            <p className="font-display text-base font-bold text-white">No pudimos cargar al grupo</p>
            <p className="text-sm font-medium text-white/70">
              {loadError} Revisá la conexión y volvé a intentarlo.
            </p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-1 min-h-11 rounded-full bg-coral px-5 font-display text-sm font-extrabold text-white transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="mt-10 flex w-full max-w-3xl flex-col items-center gap-6">
            {!showPicker && lastUser && (
              <div className="flex w-full max-w-sm flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => pick(lastUser)}
                  className="group flex w-full items-center gap-4 rounded-3xl border border-white/20 bg-white/15 p-4 text-left backdrop-blur-sm transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl">
                    {lastUser.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold tracking-wide text-white/60 uppercase">
                      Última vez entraste como
                    </span>
                    <span className="block truncate font-display text-xl font-extrabold text-white">
                      {lastUser.name}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="min-h-11 rounded-full px-4 font-display text-sm font-bold text-white/80 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
                >
                  ¿No sos vos? Ver todos
                </button>
              </div>
            )}
            {showPicker && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6"
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
          </div>
        )}

        <p className="mt-10 max-w-sm text-center text-sm font-medium leading-relaxed text-white/45">
          {isDemoMode
            ? 'Cualquiera puede sumarse al toque: elegí tu card y arrancamos. Tu elección queda guardada en este dispositivo.'
            : 'Elegí tu card. La primera vez en este dispositivo te pide el PIN del grupo para entrar.'}
        </p>
      </main>

      <footer className="relative pb-[max(1rem,env(safe-area-inset-bottom))]">
        <nav aria-label="Documentación legal" className="mx-auto flex w-full max-w-5xl items-center justify-center gap-4 px-4 text-xs font-semibold text-white/50">
          <Link to="/terminos" className="transition-colors hover:text-white">
            Términos
          </Link>
          <span aria-hidden>·</span>
          <Link to="/privacidad" className="transition-colors hover:text-white">
            Privacidad
          </Link>
          <span aria-hidden>·</span>
          <Link to="/cookies" className="transition-colors hover:text-white">
            Cookies
          </Link>
        </nav>
      </footer>

      <Modal
        open={Boolean(pinUser)}
        onClose={() => setPinUser(null)}
        title={`Hola ${pinUser?.name ?? ''}`}
        emoji={pinUser?.emoji}
        ariaLabel="Ingresar PIN del grupo"
      >
        <form onSubmit={submitPin} className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink-soft">
            Escribí el PIN que les pasó el grupo para entrar (
            <span aria-label="">si no lo tenés, pedíselo por WhatsApp</span>).
          </p>
          <input
            type="password"
            inputMode="text"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN del grupo"
            maxLength={64}
            aria-label="PIN del grupo"
            className="rounded-xl border-2 border-ink/10 px-4 py-3 font-display text-lg font-bold tracking-[0.3em] text-ink outline-none transition-colors focus:border-coral/60 focus-visible:ring-2 focus-visible:ring-coral/60"
          />
          <Button type="submit" disabled={pinBusy || pin.length === 0} className="shadow-pop">
            {pinBusy ? 'Entrando…' : 'Entrar 🎉'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}