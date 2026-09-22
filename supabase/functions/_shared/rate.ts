type RateClient = {
  rpc: (
    name: string,
    args: { p_bucket: string; p_limit: number; p_window_seconds: number },
  ) => Promise<{ data: unknown; error: { message: string } | null }>
}

// True = deja pasar (dentro del límite). False = 429.
// Falla abierto (true) ante errores de la DB para no romper la app.
export async function rateAllowed(
  client: RateClient,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { data, error } = await client.rpc('bump_rate', {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('rate_error', bucket, error.message)
      return true
    }
    return data !== false
  } catch (e) {
    console.error('rate_error', bucket, e instanceof Error ? e.message : e)
    return true
  }
}

export function ipOf(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}