// Edge Runtime type definitions
import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { appUserIdFrom, UUID_RE } from '../_shared/auth.ts'
import { ipOf, rateAllowed } from '../_shared/rate.ts'

const CURRENCIES = new Set(['USD', 'BRL', 'ARS', 'MXN', 'EUR'])
const STATUSES = new Set(['proposal', 'discussing', 'confirmed', 'discarded'])
const REACTIONS = new Set(['🔥', '❤️', '😐', '🙅'])
const URL_RE = /^https?:\/\//i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const json = (status: number, body: unknown) => Response.json(body, { status })

async function isMemberOf(client: any, tripId: string, userId: string): Promise<boolean> {
  const { data } = await client
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
}

function validDateRange(start: unknown, end: unknown): boolean {
  const s = typeof start === 'string' && DATE_RE.test(start) ? start : null
  const e = typeof end === 'string' && DATE_RE.test(end) ? end : null
  if (s && e && e < s) return false
  return true
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>
    const action = body.action

    const userId = await appUserIdFrom(req)
    if (!userId) {
      return json(401, { message: 'Sesión inválida o vencida. Volvé a entrar con tu PIN.' })
    }

    const ip = ipOf(req)
    if (!(await rateAllowed(ctx.supabaseAdmin, `ma:ip:${ip}`, 20, 60))) {
      return json(429, { message: 'Vas muy rápido, esperá un toque.' })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `ma:ip:${ip}`, 200, 3600))) {
      return json(429, { message: 'Demasiadas acciones por ahora, descansá un ratito.' })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `ma:ip:${ip}`, 2000, 86400))) {
      return json(429, { message: 'Llegaste al límite diario. El grupo se porta bien, vos también.' })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `ma:user:${userId}`, 30, 60))) {
      return json(429, { message: 'Vas muy rápido, esperá un toque.' })
    }
    if (!(await rateAllowed(ctx.supabaseAdmin, `ma:user:${userId}`, 800, 86400))) {
      return json(429, { message: 'Llegaste al límite diario de la app.' })
    }

    const A = ctx.supabaseAdmin

    try {
      switch (action) {
        // ============ trips ============
        case 'create_trip': {
          const name = typeof body.name === 'string' ? body.name.trim() : ''
          const memberIds = Array.isArray(body.member_ids) ? body.member_ids : []
          if (name.length < 2 || name.length > 80) {
            return json(400, { message: 'El nombre del viaje necesita entre 2 y 80 caracteres.' })
          }
          if (memberIds.length === 0 || memberIds.length > 12) {
            return json(400, { message: 'El viaje necesita entre 1 y 12 integrantes.' })
          }
          const ids = memberIds.filter((m: unknown) => typeof m === 'string' && UUID_RE.test(m))
          if (ids.length !== memberIds.length || new Set(ids).size !== ids.length) {
            return json(400, { message: 'Hay integrantes inválidos o repetidos.' })
          }
          if (!ids.includes(userId)) {
            return json(403, { message: 'Te tenés que incluir como integrante del viaje.' })
          }
          if (typeof body.currency !== 'string' || !CURRENCIES.has(body.currency)) {
            return json(400, { message: 'Moneda inválida.' })
          }
          if (!validDateRange(body.start_date, body.end_date)) {
            return json(400, { message: 'La fecha de fin es antes que la de inicio.' })
          }
          const { data: trip, error } = await A
            .from('trips')
            .insert({
              name,
              description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) || null : null,
              currency: body.currency,
              start_date: body.start_date ?? null,
              end_date: body.end_date ?? null,
              created_by: userId,
              status: 'planning',
            })
            .select()
            .single()
          if (error) return json(error.code === '23505' ? 409 : 500, { message: error.message })
          const { error: mErr } = await A
            .from('trip_members')
            .insert(ids.map((memberId: string) => ({ trip_id: trip.id, user_id: memberId })))
          if (mErr) return json(500, { message: mErr.message })
          return json(200, { ok: true, trip })
        }

        case 'update_trip': {
          const tripId = body.trip_id as string
          if (typeof tripId !== 'string' || !UUID_RE.test(tripId)) {
            return json(400, { message: 'trip_id inválido' })
          }
          if (!(await isMemberOf(A, tripId, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const patch: Record<string, unknown> = {}
          if (body.patch && typeof body.patch === 'object') {
            for (const [k, v] of Object.entries(body.patch)) {
              if (k === 'name') {
                const n = typeof v === 'string' ? v.trim() : ''
                if (n.length < 2 || n.length > 80) return json(400, { message: 'Nombre inválido.' })
                patch.name = n
              } else if (k === 'description') {
                patch.description = typeof v === 'string' ? v.trim().slice(0, 500) || null : null
              } else if (k === 'currency') {
                if (typeof v !== 'string' || !CURRENCIES.has(v)) return json(400, { message: 'Moneda inválida.' })
                patch.currency = v
              } else if (k === 'start_date' || k === 'end_date') {
                patch[k] = v ?? null
              }
            }
            if (!validDateRange(patch.start_date, patch.end_date)) {
              return json(400, { message: 'La fecha de fin es antes que la de inicio.' })
            }
          }
          const { data: trip, error } = await A.from('trips').update(patch).eq('id', tripId).select().single()
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true, trip })
        }

        case 'set_member_plan': {
          const tripId = body.trip_id as string
          const targetUser = body.user_id as string
          if (typeof tripId !== 'string' || typeof targetUser !== 'string') {
            return json(400, { message: 'Datos inválidos.' })
          }
          if (targetUser !== userId) {
            return json(403, { message: 'Solo podés editar tus propias fechas.' })
          }
          if (!(await isMemberOf(A, tripId, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const location = typeof body.location === 'string' ? body.location.trim().slice(0, 200) : null
          if (!validDateRange(body.arrival_date, body.departure_date)) {
            return json(400, { message: 'La fecha de partida es antes que la de llegada.' })
          }
          const { data: plan, error } = await A
            .from('trip_members')
            .update({
              arrival_date: body.arrival_date ?? null,
              departure_date: body.departure_date ?? null,
              location: location || null,
            })
            .eq('trip_id', tripId)
            .eq('user_id', userId)
            .select('user_id, arrival_date, departure_date, location')
            .single()
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true, plan })
        }

        // ============ ideas ============
        case 'create_idea': {
          if (!(await rateAllowed(A, `ma:idea:${userId}`, 15, 3600))) {
            return json(429, { message: 'Máximo 15 ideas por hora, proponé con criterio.' })
          }
          const tripId = body.trip_id as string
          const title = typeof body.title === 'string' ? body.title.trim() : ''
          if (typeof tripId !== 'string') return json(400, { message: 'trip_id inválido' })
          if (!(await isMemberOf(A, tripId, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { data: cat } = await A.from('categories').select('id').eq('id', body.category_id ?? '').maybeSingle()
          if (typeof body.category_id !== 'string' || !cat) return json(400, { message: 'Elegí una categoría válida.' })
          if (title.length < 3 || title.length > 120) {
            return json(400, { message: 'El título necesita entre 3 y 120 caracteres.' })
          }
          if (body.price != null && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0 || body.price >= 10000000)) {
            return json(400, { message: 'Precio inválido (0 o más).' })
          }
          if (typeof body.currency !== 'string' || !CURRENCIES.has(body.currency)) {
            return json(400, { message: 'Moneda inválida.' })
          }
          for (const field of ['description', 'link', 'image_url'] as const) {
            const v = body[field]
            if (typeof v === 'string' && v.length > (field === 'description' ? 2000 : 500)) {
              return json(400, { message: `El campo ${field} es demasiado largo.` })
            }
            if ((field === 'link' || field === 'image_url') && typeof v === 'string' && v.trim() && !URL_RE.test(v.trim())) {
              return json(400, { message: `${field} debe ser una URL http(s).` })
            }
          }
          const { data: idea, error } = await A
            .from('ideas')
            .insert({
              trip_id: tripId,
              category_id: body.category_id,
              user_id: userId,
              title,
              description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) || null : null,
              link: typeof body.link === 'string' ? body.link.trim().slice(0, 500) || null : null,
              image_url: typeof body.image_url === 'string' ? body.image_url.trim().slice(0, 500) || null : null,
              price: body.price ?? null,
              currency: body.currency,
              status: 'proposal',
            })
            .select()
            .single()
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true, idea })
        }

        case 'update_idea_status': {
          const ideaId = body.idea_id as string
          const status = body.status as string
          if (typeof ideaId !== 'string') return json(400, { message: 'idea_id inválido' })
          if (typeof status !== 'string' || !STATUSES.has(status)) {
            return json(400, { message: 'Estado inválido.' })
          }
          const { data: idea } = await A.from('ideas').select('trip_id').eq('id', ideaId).maybeSingle()
          if (!idea) return json(404, { message: 'La idea no existe' })
          if (!(await isMemberOf(A, idea.trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { data: updated, error } = await A.from('ideas').update({ status }).eq('id', ideaId).select().single()
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true, idea: updated })
        }

        case 'delete_idea': {
          const ideaId = body.idea_id as string
          if (typeof ideaId !== 'string') return json(400, { message: 'idea_id inválido' })
          const { data: idea } = await A.from('ideas').select('trip_id').eq('id', ideaId).maybeSingle()
          if (!idea) return json(404, { message: 'La idea no existe' })
          if (!(await isMemberOf(A, idea.trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { error } = await A.from('ideas').delete().eq('id', ideaId)
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true })
        }

        // ============ votos ============
        case 'vote':
        case 'remove_vote': {
          if (!(await rateAllowed(A, `ma:vote:${userId}`, 120, 3600))) {
            return json(429, { message: 'Bajá un cambio con las reacciones por un rato.' })
          }
          const ideaId = body.idea_id as string
          if (typeof ideaId !== 'string') return json(400, { message: 'idea_id inválido' })
          const { data: idea } = await A.from('ideas').select('trip_id').eq('id', ideaId).maybeSingle()
          if (!idea) return json(404, { message: 'La idea no existe' })
          if (!(await isMemberOf(A, idea.trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          if (action === 'vote') {
            if (typeof body.reaction !== 'string' || !REACTIONS.has(body.reaction)) {
              return json(400, { message: 'Reacción inválida.' })
            }
            const { error } = await A
              .from('votes')
              .upsert({ idea_id: ideaId, user_id: userId, reaction: body.reaction }, { onConflict: 'idea_id,user_id' })
            if (error) return json(500, { message: error.message })
          } else {
            const { error } = await A.from('votes').delete().eq('idea_id', ideaId).eq('user_id', userId)
            if (error) return json(500, { message: error.message })
          }
          return json(200, { ok: true })
        }

        // ============ comentarios ============
        case 'add_comment': {
          if (!(await rateAllowed(A, `ma:comment:${userId}`, 40, 3600))) {
            return json(429, { message: 'Máximo 40 comentarios por hora.' })
          }
          const ideaId = body.idea_id as string
          const text = typeof body.body === 'string' ? body.body.trim() : ''
          if (typeof ideaId !== 'string') return json(400, { message: 'idea_id inválido' })
          if (text.length < 1 || text.length > 500) {
            return json(400, { message: 'El comentario necesita entre 1 y 500 caracteres.' })
          }
          const { data: idea } = await A.from('ideas').select('trip_id').eq('id', ideaId).maybeSingle()
          if (!idea) return json(404, { message: 'La idea no existe' })
          if (!(await isMemberOf(A, idea.trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { data: comment, error } = await A
            .from('comments')
            .insert({ idea_id: ideaId, user_id: userId, body: text })
            .select()
            .single()
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true, comment })
        }

        // ============ itinerario ============
        case 'add_to_itinerary': {
          const { trip_id, idea_id, day_number } = body
          if (typeof trip_id !== 'string' || !UUID_RE.test(trip_id) || typeof idea_id !== 'string' || !UUID_RE.test(idea_id)) {
            return json(400, { message: 'Datos inválidos.' })
          }
          if (!Number.isInteger(day_number) || day_number < 1) {
            return json(400, { message: 'Día inválido.' })
          }
          if (!(await isMemberOf(A, trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { data: idea } = await A.from('ideas').select('id, trip_id, status').eq('id', idea_id).maybeSingle()
          if (!idea) return json(404, { message: 'La idea no existe' })
          if (idea.trip_id !== trip_id) return json(400, { message: 'La idea no pertenece al viaje' })
          if (idea.status !== 'confirmed') return json(400, { message: 'Solo se agregan ideas confirmadas' })
          const { data: existing } = await A
            .from('itinerary_items')
            .select('id')
            .eq('trip_id', trip_id)
            .eq('idea_id', idea_id)
            .maybeSingle()
          if (existing) return json(409, { message: 'La idea ya está en el itinerario' })
          const { data: last } = await A
            .from('itinerary_items')
            .select('sort_order')
            .eq('trip_id', trip_id)
            .eq('day_number', day_number)
            .order('sort_order', { ascending: false })
            .limit(1)
            .maybeSingle()
          const sortOrder = (last?.sort_order as number | undefined ?? 0) + 1
          const { data: item, error } = await A
            .from('itinerary_items')
            .insert({ trip_id, idea_id, day_number, sort_order: sortOrder, added_by: userId })
            .select('*')
            .single()
          if (error) {
            if (error.code === '23505') return json(409, { message: 'La idea ya está en el itinerario' })
            return json(500, { message: error.message })
          }
          return json(200, { ok: true, item })
        }

        case 'remove_from_itinerary': {
          const itemId = body.item_id as string
          if (typeof itemId !== 'string') return json(400, { message: 'item_id inválido' })
          const { data: item } = await A.from('itinerary_items').select('id, trip_id').eq('id', itemId).maybeSingle()
          if (!item) return json(404, { message: 'El ítem no existe' })
          if (!(await isMemberOf(A, item.trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { error } = await A.from('itinerary_items').delete().eq('id', itemId)
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true })
        }

        case 'move_itinerary_item': {
          const itemId = body.item_id as string
          const dayNumber = body.day_number as number
          const sortOrder = body.sort_order as number
          if (typeof itemId !== 'string') return json(400, { message: 'item_id inválido' })
          if (!Number.isInteger(dayNumber) || dayNumber < 1 || !Number.isInteger(sortOrder) || sortOrder < 0) {
            return json(400, { message: 'Día u orden inválidos.' })
          }
          const { data: item } = await A.from('itinerary_items').select('id, trip_id').eq('id', itemId).maybeSingle()
          if (!item) return json(404, { message: 'El ítem no existe' })
          if (!(await isMemberOf(A, item.trip_id, userId))) {
            return json(403, { message: 'No sos parte de este viaje.' })
          }
          const { error } = await A
            .from('itinerary_items')
            .update({ day_number: dayNumber, sort_order: sortOrder })
            .eq('id', itemId)
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true })
        }

        // ============ push ============
        case 'upsert_push_subscription': {
          const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : ''
          const p256dh = typeof body.p256dh === 'string' ? body.p256dh : ''
          const authKey = typeof body.auth === 'string' ? body.auth : ''
          if (!endpoint || endpoint.length > 500 || !URL_RE.test(endpoint)) {
            return json(400, { message: 'Endpoint inválido.' })
          }
          if (p256dh.length < 8 || p256dh.length > 256 || authKey.length < 8 || authKey.length > 256) {
            return json(400, { message: 'Claves de suscripción inválidas.' })
          }
          const { error } = await A.from('push_subscriptions').upsert(
            { user_id: userId, endpoint, p256dh, auth: authKey, updated_at: new Date().toISOString() },
            { onConflict: 'endpoint' },
          )
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true })
        }

        case 'remove_push_subscription': {
          const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : ''
          if (!endpoint || endpoint.length > 500) return json(400, { message: 'Endpoint inválido.' })
          const { error } = await A
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', endpoint)
          if (error) return json(500, { message: error.message })
          return json(200, { ok: true })
        }

        default:
          return json(400, { message: 'Acción desconocida' })
      }
    } catch (e) {
      console.error('member-actions error', action, e)
      return json(500, { message: 'Error interno' })
    }
  }),
}