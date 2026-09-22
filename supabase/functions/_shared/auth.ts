import { jwtVerify } from 'https://esm.sh/jose@5'

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Comparación en tiempo constante (para el PIN).
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Extrae y valida el app_user_id del JWT custom firmado por `login`.
export async function appUserIdFrom(req: Request): Promise<string | null> {
  const header = req.headers.get('authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const secret = Deno.env.get('JWT_SIGNING_SECRET')
  if (!secret || secret.length < 32) return null
  try {
    const { payload } = await jwtVerify(header.slice(7), new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
      issuer: 'somos-brasil',
    })
    const uid = payload.app_user_id
    return typeof uid === 'string' && UUID_RE.test(uid) ? uid : null
  } catch {
    return null
  }
}