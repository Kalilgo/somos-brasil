// Edge Runtime type definitions
import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { appUserIdFrom } from '../_shared/auth.ts'
import { ipOf, rateAllowed } from '../_shared/rate.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Valida la regla de negocio "solo ideas confirmadas entran al itinerario" (plan §2.8/D4)
// en el servidor, de modo que no viva solo en el cliente.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    // Deprecada: la escritura de itinerario se movió a member-actions. Se mantiene
    // endurecida (JWT + rate limit) para que no quede ningún path de escritura abierto.
    const userId = await appUserIdFrom(req)
    if (!userId) {
      return Response.json({ message: 'Sesión inválida o vencida.' }, { status: 401 })
    }
    const ip = ipOf(req)
    if (!(await rateAllowed(ctx.supabaseAdmin, `ait:ip:${ip}`, 20, 60))) {
      return Response.json({ message: 'Vas muy rápido, esperá un toque.' }, { status: 429 })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `ait:user:${userId}`, 30, 3600))) {
      return Response.json({ message: 'Máximo 30 cambios de itinerario por hora.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({})) as {
      trip_id?: unknown
      idea_id?: unknown
      day_number?: unknown
      user_id?: unknown
    }
    const { trip_id, idea_id, day_number } = body

    if (typeof trip_id !== 'string' || !UUID_RE.test(trip_id)) {
      return Response.json({ message: 'trip_id inválido' }, { status: 400 })
    }
    if (typeof idea_id !== 'string' || !UUID_RE.test(idea_id)) {
      return Response.json({ message: 'idea_id inválido' }, { status: 400 })
    }
    if (!Number.isInteger(day_number) || (day_number as number) < 1) {
      return Response.json({ message: 'day_number debe ser un entero >= 1' }, { status: 400 })
    }

    const { data: trip } = await ctx.supabaseAdmin
      .from('trips')
      .select('id')
      .eq('id', trip_id)
      .maybeSingle()
    if (!trip) {
      return Response.json({ message: 'El viaje no existe' }, { status: 404 })
    }

    const { data: idea } = await ctx.supabaseAdmin
      .from('ideas')
      .select('id, trip_id, status')
      .eq('id', idea_id)
      .maybeSingle()
    if (!idea) {
      return Response.json({ message: 'La idea no existe' }, { status: 404 })
    }
    if (idea.trip_id !== trip_id) {
      return Response.json({ message: 'La idea no pertenece al viaje' }, { status: 400 })
    }
    if (idea.status !== 'confirmed') {
      return Response.json({ message: 'Solo se agregan ideas confirmadas' }, { status: 400 })
    }

    const { data: existing } = await ctx.supabaseAdmin
      .from('itinerary_items')
      .select('id')
      .eq('trip_id', trip_id)
      .eq('idea_id', idea_id)
      .maybeSingle()
    if (existing) {
      return Response.json({ message: 'La idea ya está en el itinerario' }, { status: 409 })
    }

    const { data: last } = await ctx.supabaseAdmin
      .from('itinerary_items')
      .select('sort_order')
      .eq('trip_id', trip_id)
      .eq('day_number', day_number)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sort_order = (last?.sort_order as number | undefined ?? 0) + 1

    const { data: item, error } = await ctx.supabaseAdmin
      .from('itinerary_items')
      .insert({ trip_id, idea_id, day_number, sort_order, added_by: userId })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json({ message: 'La idea ya está en el itinerario' }, { status: 409 })
      }
      console.error('ait_insert_error', error.message)
      return Response.json({ message: 'No se pudo agregar al itinerario.' }, { status: 500 })
    }

    return Response.json({ ok: true, item })
  }),
}