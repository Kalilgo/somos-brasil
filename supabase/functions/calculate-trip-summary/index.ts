// Edge Runtime type definitions
import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

// auth 'none': la app no usa auth.users (decisión D1). Los endpoints validan input y
// devuelven JSON de error; el endurecimiento con clave publishable se documenta en
// docs/decisions.md. verify_jwt = false en config.toml.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const body = await req.json().catch(() => ({})) as { trip_id?: unknown }
    const { trip_id } = body

    if (typeof trip_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trip_id)) {
      return Response.json({ message: 'trip_id inválido' }, { status: 400 })
    }

    const { data: trip, error: tripError } = await ctx.supabaseAdmin
      .from('trips')
      .select('id')
      .eq('id', trip_id)
      .maybeSingle()

    if (tripError || !trip) {
      return Response.json({ message: 'El viaje no existe' }, { status: 404 })
    }

    const { data, error } = await ctx.supabaseAdmin.rpc('get_trip_summary', { p_trip_id: trip_id })

    if (error) {
      return Response.json({ message: error.message }, { status: 500 })
    }

    if (data.member_count === 0) {
      return Response.json({ message: 'El viaje no tiene integrantes' }, { status: 400 })
    }

    return Response.json(data)
  }),
}