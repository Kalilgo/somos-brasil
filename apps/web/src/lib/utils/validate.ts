/**
 * Lo que viene de la URL es entrada de usuario, tan ajena al resto como lo que
 * viene de un POST. Se valida en el borde de la app (una sola vez, en el punto por
 * donde entra) y no repetido en cada componente.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Un id de la base es siempre un UUID. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/**
 * Devuelve el id solo si es un UUID, o null. Para usar en vez de `param ?? null`
 * cuando el valor después llega a una query.
 */
export function asUuid(value: unknown): string | null {
  return isUuid(value) ? value : null
}

/** Acota un valor de query param para que no se vaya de largo. */
export function clampParam(value: string | null, max: number, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (trimmed === '') return fallback
  return trimmed.length > max ? fallback : trimmed
}
