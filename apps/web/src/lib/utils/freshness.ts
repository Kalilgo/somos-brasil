import { DATA_TTL_MS } from './constants'

/** ¿Los datos en memoria ya son viejos para volver a pedir? */
export function isStale(loadedAt: number, ttl = DATA_TTL_MS): boolean {
  return loadedAt === 0 || Date.now() - loadedAt >= ttl
}
