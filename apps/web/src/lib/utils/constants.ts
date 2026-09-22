import type { Currency, IdeaStatus, Reaction } from '@/types/db'

export const STORAGE_KEYS = {
  user: 'somos-brasil-user',
} as const

export const CURRENCIES: Currency[] = ['USD', 'BRL', 'ARS', 'MXN', 'EUR']

export const REACTIONS: { reaction: Reaction; label: string }[] = [
  { reaction: '🔥', label: '¡va!' },
  { reaction: '❤️', label: 'me encanta' },
  { reaction: '😐', label: 'meh...' },
  { reaction: '🙅', label: 'no' },
]

export const IDEA_STATUSES: Record<
  IdeaStatus,
  { label: string; emoji: string; chip: string; dot: string }
> = {
  proposal: { label: 'Propuesta', emoji: '💡', chip: 'bg-sky/15 text-sky', dot: 'bg-sky' },
  discussing: { label: 'En discusión', emoji: '🗣️', chip: 'bg-mango/25 text-[#8a5a00]', dot: 'bg-mango' },
  confirmed: { label: 'Confirmada', emoji: '✅', chip: 'bg-verde/15 text-verde-dark', dot: 'bg-verde' },
  discarded: { label: 'Descartada', emoji: '🗑️', chip: 'bg-ink/10 text-ink-soft', dot: 'bg-ink/30' },
}

export const IDEA_STATUS_FLOW: IdeaStatus[] = ['proposal', 'discussing', 'confirmed', 'discarded']

export const SCORE_WEIGHTS = {
  ideas: 3,
  votes: 1,
  comments: 2,
} as const

export const LOADING_MESSAGES = [
  'Ordenando las maletas...',
  'Consultando al oráculo del viaje...',
  'Quemando la caipirinha virtual...',
  'Negociando descuento en el vuelo...',
  'Sacándole fotos a la playa desde acá...',
  'Haciendo señas para frenar el bondi...',
  'Pegándole al pombo con el grupo...',
  'Buscando el mejor churrasco del barrio...',
]

export const EMPTY_MESSAGES: Record<string, { emoji: string; title: string; cta: string }> = {
  ideas: {
    emoji: '🦜',
    title: '¡Todavía no hay nada por acá!',
    cta: 'Proponé la primera idea y arranquemos',
  },
  itinerary: {
    emoji: '🗓️',
    title: 'El itinerario está en blanco',
    cta: 'Confirmá ideas y andá armando los días',
  },
  trips: {
    emoji: '🏝️',
    title: 'No hay viajes todavía',
    cta: 'Creá el primero y juntemos al grupo',
  },
  comments: {
    emoji: '👀',
    title: 'Sin comentarios',
    cta: '¿Nadie tiene nada que decir?',
  },
  ranking: {
    emoji: '🏆',
    title: 'Sin ranking todavía',
    cta: 'Empezá a proponer y votar para aparecer acá',
  },
} as const