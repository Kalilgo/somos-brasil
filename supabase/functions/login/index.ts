// Edge Runtime type definitions
import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { SignJWT } from 'https://esm.sh/jose@5'
import { timingSafeEqual, UUID_RE } from '../_shared/auth.ts'
import { ipOf, rateAllowed } from '../_shared/rate.ts'

const DAYS = 30

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const ip = ipOf(req)
    if (!(await rateAllowed(ctx.supabaseAdmin, `login:ip:${ip}`, 30, 300))) {
      return Response.json({ message: 'Vas muy rápido, esperá un momento.' }, { status: 429 })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `login:ip:${ip}`, 120, 86400))) {
      return Response.json({ message: 'Demasiados intentos de hoy, volvé mañana.' }, { status: 429 })
    }

    const body = (await req.json().catch(() => ({}))) as { user_id?: unknown; pin?: unknown }
    const { user_id, pin } = body

    if (typeof user_id !== 'string' || !UUID_RE.test(user_id)) {
      return Response.json({ message: 'user_id inválido' }, { status: 400 })
    }
    if (typeof pin !== 'string' || pin.length === 0 || pin.length > 64) {
      return Response.json({ message: 'PIN inválido' }, { status: 400 })
    }

    const expected = Deno.env.get('GROUP_PIN')
    const secret = Deno.env.get('JWT_SIGNING_SECRET')
    if (!expected || !secret || secret.length < 32) {
      console.error('login: faltan GROUP_PIN / JWT_SIGNING_SECRET')
      return Response.json({ message: 'Servidor mal configurado' }, { status: 500 })
    }

    if (!timingSafeEqual(pin, expected)) {
      return Response.json({ message: 'PIN incorrecto' }, { status: 401 })
    }

    const { data: user } = await ctx.supabaseAdmin
      .from('users')
      .select('id, name, emoji, color')
      .eq('id', user_id)
      .maybeSingle()
    if (!user) {
      return Response.json({ message: 'El usuario no existe' }, { status: 404 })
    }

    const token = await new SignJWT({
      app_user_id: user.id,
      app_username: user.name,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer('somos-brasil')
      .setIssuedAt()
      .setExpirationTime(`${DAYS}d`)
      .sign(new TextEncoder().encode(secret))

    return Response.json({ token, user })
  }),
}